import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'internhunt.db');
const JSON_FALLBACK = path.join(process.cwd(), 'internhunt-fallback.json');

let db: Database.Database;

function getDb(): Database.Database {
  if (db) return db;
  try {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS internships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT,
        is_remote INTEGER DEFAULT 0,
        is_india INTEGER DEFAULT 0,
        duration TEXT,
        stipend TEXT,
        apply_link TEXT,
        source TEXT,
        posted_date TEXT,
        deadline TEXT,
        tags TEXT,
        is_active INTEGER DEFAULT 1,
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        hash TEXT UNIQUE
      );
      CREATE TABLE IF NOT EXISTS fetch_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT,
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        count_added INTEGER,
        count_skipped INTEGER,
        status TEXT,
        error_message TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_hash ON internships(hash);
      CREATE INDEX IF NOT EXISTS idx_active ON internships(is_active);
      CREATE INDEX IF NOT EXISTS idx_source ON internships(source);
    `);
    // Mark stale listings
    db.exec(`UPDATE internships SET is_active = 0 WHERE fetched_at < datetime('now', '-30 days') AND is_active = 1`);
    return db;
  } catch (err) {
    console.error('SQLite failed, using JSON fallback:', err);
    throw err;
  }
}

export interface Internship {
  id?: number;
  title: string;
  company: string;
  location?: string;
  is_remote?: number;
  is_india?: number;
  duration?: string;
  stipend?: string;
  apply_link?: string;
  source?: string;
  posted_date?: string;
  deadline?: string;
  tags?: string;
  is_active?: number;
  fetched_at?: string;
  hash?: string;
}

export interface FetchLog {
  id?: number;
  source: string;
  fetched_at?: string;
  count_added: number;
  count_skipped: number;
  status: string;
  error_message?: string;
}

export function insertInternship(intern: Internship): boolean {
  const d = getDb();
  try {
    const stmt = d.prepare(`
      INSERT OR IGNORE INTO internships (title, company, location, is_remote, is_india, duration, stipend, apply_link, source, posted_date, deadline, tags, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      intern.title, intern.company, intern.location || '',
      intern.is_remote || 0, intern.is_india || 0,
      intern.duration || '', intern.stipend || '',
      intern.apply_link || '', intern.source || '',
      intern.posted_date || '', intern.deadline || '',
      intern.tags || '', intern.hash || ''
    );
    return result.changes > 0;
  } catch {
    return false;
  }
}

export function insertFetchLog(log: FetchLog): void {
  const d = getDb();
  d.prepare(`
    INSERT INTO fetch_logs (source, count_added, count_skipped, status, error_message)
    VALUES (?, ?, ?, ?, ?)
  `).run(log.source, log.count_added, log.count_skipped, log.status, log.error_message || '');
}

export function getInternships(filters: {
  search?: string;
  location?: string;
  category?: string;
  stipend?: string;
  sort?: string;
  sources?: string[];
  page?: number;
  limit?: number;
}): { data: Internship[]; total: number } {
  const d = getDb();
  const conditions: string[] = ['is_active = 1'];
  const params: any[] = [];

  if (filters.search) {
    conditions.push(`(title LIKE ? OR company LIKE ? OR tags LIKE ?)`);
    const s = `%${filters.search}%`;
    params.push(s, s, s);
  }
  if (filters.location === 'remote') {
    conditions.push('is_remote = 1');
  } else if (filters.location === 'india') {
    conditions.push('is_india = 1');
  }
  if (filters.category && filters.category !== 'All') {
    conditions.push('tags LIKE ?');
    params.push(`%${filters.category}%`);
  }
  if (filters.stipend === 'paid') {
    conditions.push(`stipend != '' AND stipend != 'Unpaid'`);
  } else if (filters.stipend === 'unpaid') {
    conditions.push(`(stipend = '' OR stipend = 'Unpaid')`);
  }
  if (filters.sources && filters.sources.length > 0) {
    conditions.push(`source IN (${filters.sources.map(() => '?').join(',')})`);
    params.push(...filters.sources);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'ORDER BY fetched_at DESC';
  if (filters.sort === 'oldest') orderBy = 'ORDER BY fetched_at ASC';
  else if (filters.sort === 'company') orderBy = 'ORDER BY company ASC';
  else if (filters.sort === 'stipend') orderBy = 'ORDER BY stipend DESC';

  const limit = filters.limit || 24;
  const offset = ((filters.page || 1) - 1) * limit;

  const total = (d.prepare(`SELECT COUNT(*) as count FROM internships ${where}`).get(...params) as any).count;
  const data = d.prepare(`SELECT * FROM internships ${where} ${orderBy} LIMIT ? OFFSET ?`).all(...params, limit, offset) as Internship[];

  return { data, total };
}

export function getStats(): { total: number; today: number; remote: number; india: number } {
  const d = getDb();
  const total = (d.prepare('SELECT COUNT(*) as c FROM internships WHERE is_active = 1').get() as any).c;
  const today = (d.prepare(`SELECT COUNT(*) as c FROM internships WHERE is_active = 1 AND date(fetched_at) = date('now')`).get() as any).c;
  const remote = (d.prepare('SELECT COUNT(*) as c FROM internships WHERE is_active = 1 AND is_remote = 1').get() as any).c;
  const india = (d.prepare('SELECT COUNT(*) as c FROM internships WHERE is_active = 1 AND is_india = 1').get() as any).c;
  return { total, today, remote, india };
}

export function getFetchLogs(days: number = 7): FetchLog[] {
  const d = getDb();
  return d.prepare(`SELECT * FROM fetch_logs WHERE fetched_at > datetime('now', '-${days} days') ORDER BY fetched_at DESC`).all() as FetchLog[];
}

export function clearDatabase(): void {
  const d = getDb();
  d.exec('DELETE FROM internships');
  d.exec('DELETE FROM fetch_logs');
}

export function isDatabaseEmpty(): boolean {
  const d = getDb();
  const row = d.prepare('SELECT COUNT(*) as c FROM internships').get() as any;
  return row.c === 0;
}

// JSON fallback functions
export function saveToJsonFallback(internships: Internship[]): void {
  fs.writeFileSync(JSON_FALLBACK, JSON.stringify(internships, null, 2));
}

export function loadFromJsonFallback(): Internship[] {
  if (!fs.existsSync(JSON_FALLBACK)) return [];
  return JSON.parse(fs.readFileSync(JSON_FALLBACK, 'utf-8'));
}
