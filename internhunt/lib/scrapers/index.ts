import { Internship, insertInternship, insertFetchLog } from '../db';
import { scrapeRemotive } from './remotive';
import { scrapeArbeitnow } from './arbeitnow';
import { scrapeTheMuse } from './themuse';
import { scrapeJobicy } from './jobicy';
import { scrapeAdzuna } from './adzuna';
import { scrapeJooble } from './jooble';
import { scrapeReed } from './reed';
import { scrapeHackerNews } from './hackernews';
import { scrapeGitHubLists } from './github-lists';
import { scrapeGoogleCSE } from './google-cse';
import { scrapeInternshala } from './internshala';
import { scrapeUnstop } from './unstop';
import { scrapeTalentBattle } from './talentbattle';
import { scrapeNaukri } from './naukri';
import { scrapeShine } from './shine';
import { scrapeFresherworld } from './fresherworld';
import { scrapeLinkedIn } from './linkedin';
import { scrapeWellfound } from './wellfound';
import { scrapeYCombinator } from './ycombinator';
import { scrapeDevfolio } from './devfolio';
import fs from 'fs';
import path from 'path';

export const ALL_SOURCES = [
  'Remotive', 'Arbeitnow', 'The Muse', 'Jobicy', 'Adzuna',
  'Jooble', 'Reed', 'HackerNews', 'GitHub Lists', 'Google CSE',
  'Internshala', 'Unstop', 'TalentBattle', 'Naukri', 'Shine',
  'Fresherworld', 'LinkedIn', 'Wellfound', 'Y Combinator', 'Devfolio',
];

interface ScraperEntry {
  name: string;
  fn: () => Promise<Internship[]>;
}

const scrapers: ScraperEntry[] = [
  { name: 'Remotive', fn: scrapeRemotive },
  { name: 'Arbeitnow', fn: scrapeArbeitnow },
  { name: 'The Muse', fn: scrapeTheMuse },
  { name: 'Jobicy', fn: scrapeJobicy },
  { name: 'Adzuna', fn: scrapeAdzuna },
  { name: 'Jooble', fn: scrapeJooble },
  { name: 'Reed', fn: scrapeReed },
  { name: 'HackerNews', fn: scrapeHackerNews },
  { name: 'GitHub Lists', fn: scrapeGitHubLists },
  { name: 'Google CSE', fn: scrapeGoogleCSE },
  { name: 'Internshala', fn: scrapeInternshala },
  { name: 'Unstop', fn: scrapeUnstop },
  { name: 'TalentBattle', fn: scrapeTalentBattle },
  { name: 'Naukri', fn: scrapeNaukri },
  { name: 'Shine', fn: scrapeShine },
  { name: 'Fresherworld', fn: scrapeFresherworld },
  { name: 'LinkedIn', fn: scrapeLinkedIn },
  { name: 'Wellfound', fn: scrapeWellfound },
  { name: 'Y Combinator', fn: scrapeYCombinator },
  { name: 'Devfolio', fn: scrapeDevfolio },
];

function logToFile(message: string) {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `fetch-${date}.log`);
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
}

export async function fetchAll(enabledSources?: string[]): Promise<{
  totalAdded: number;
  totalSkipped: number;
  results: { source: string; added: number; skipped: number; status: string; error?: string }[];
}> {
  const activeScraper = enabledSources
    ? scrapers.filter(s => enabledSources.includes(s.name))
    : scrapers;

  logToFile(`Starting fetch for ${activeScraper.length} sources`);

  const settledResults = await Promise.allSettled(
    activeScraper.map(async (scraper) => {
      const startTime = Date.now();
      try {
        const internships = await scraper.fn();
        let added = 0;
        let skipped = 0;

        for (const intern of internships) {
          const inserted = insertInternship(intern);
          if (inserted) added++;
          else skipped++;
        }

        const elapsed = Date.now() - startTime;
        logToFile(`${scraper.name}: ${added} added, ${skipped} skipped (${elapsed}ms)`);

        insertFetchLog({
          source: scraper.name,
          count_added: added,
          count_skipped: skipped,
          status: 'success',
        });

        return { source: scraper.name, added, skipped, status: 'success' as const };
      } catch (err: any) {
        const errorMsg = err?.message || 'Unknown error';
        logToFile(`${scraper.name}: FAILED - ${errorMsg}`);

        insertFetchLog({
          source: scraper.name,
          count_added: 0,
          count_skipped: 0,
          status: 'failed',
          error_message: errorMsg,
        });

        return { source: scraper.name, added: 0, skipped: 0, status: 'failed' as const, error: errorMsg };
      }
    })
  );

  const results = settledResults.map(r => {
    if (r.status === 'fulfilled') return r.value;
    return { source: 'Unknown', added: 0, skipped: 0, status: 'failed', error: 'Promise rejected' };
  });

  const totalAdded = results.reduce((s, r) => s + r.added, 0);
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);

  logToFile(`Fetch complete: ${totalAdded} added, ${totalSkipped} skipped`);

  return { totalAdded, totalSkipped, results };
}

export async function fetchSingle(sourceName: string) {
  return fetchAll([sourceName]);
}
