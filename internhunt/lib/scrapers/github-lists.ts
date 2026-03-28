import axios from 'axios';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const README_URLS = [
  'https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md',
  'https://raw.githubusercontent.com/Ouckah/Summer2026-Internships/main/README.md',
  'https://raw.githubusercontent.com/pittcsc/Summer2026-Internships/dev/README.md',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
};

function parseMarkdownTable(content: string): Internship[] {
  const results: Internship[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---')) continue;

    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 3) continue;

    // Typical format: Company | Role | Location | Link | Date
    const company = cols[0]?.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    const role = cols[1]?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
    const location = cols[2]?.trim() || '';

    if (!company || !role || company === 'Company') continue;

    // Check location
    const locationLower = location.toLowerCase();
    const hasValidLocation = ['india', 'remote', '🌎', 'worldwide', 'global'].some(k => locationLower.includes(k));
    if (!hasValidLocation && location !== '') continue;

    // Extract apply link
    const linkMatch = line.match(/\[([^\]]*)\]\(([^)]+)\)/g);
    let applyLink = '';
    if (linkMatch) {
      for (const m of linkMatch) {
        const urlMatch = m.match(/\(([^)]+)\)/);
        if (urlMatch) {
          applyLink = urlMatch[1];
          break;
        }
      }
    }

    if (shouldExclude(role)) continue;

    const hash = generateHash(company, role, applyLink);
    const { isRemote, isIndia } = detectLocation(location);

    results.push({
      title: role,
      company,
      location: location || 'Remote',
      is_remote: isRemote ? 1 : 0,
      is_india: isIndia ? 1 : 0,
      stipend: '',
      apply_link: applyLink,
      source: 'GitHub Lists',
      posted_date: cols[4]?.trim() || '',
      tags: autoTag(role).join(', '),
      hash,
    });
  }

  return results;
}

export async function scrapeGitHubLists(): Promise<Internship[]> {
  const allResults: Internship[] = [];

  for (const url of README_URLS) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 30000, responseType: 'text' });
      const parsed = parseMarkdownTable(data);
      allResults.push(...parsed);
    } catch (err) {
      console.error(`GitHub Lists fetch error for ${url}:`, err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return allResults;
}
