import axios from 'axios';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Content-Type': 'application/json',
};

const QUERIES = [
  { keywords: 'software intern', location: 'India' },
  { keywords: 'developer internship', location: 'India' },
  { keywords: 'remote software intern', location: '' },
];

export async function scrapeJooble(): Promise<Internship[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    console.warn('Jooble: API key not configured, skipping');
    return [];
  }

  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const query of QUERIES) {
    try {
      const { data } = await axios.post(
        `https://jooble.org/api/${apiKey}`,
        query,
        { headers, timeout: 15000 }
      );

      const jobs = data.jobs || [];
      for (const job of jobs) {
        const title = job.title || '';
        if (shouldExclude(title)) continue;

        const company = job.company || 'Unknown';
        const applyLink = job.link || '';
        const hash = generateHash(company, title, applyLink);

        if (seen.has(hash)) continue;
        seen.add(hash);

        const location = job.location || query.location || 'Remote';
        const { isRemote, isIndia } = detectLocation(location);

        results.push({
          title,
          company,
          location,
          is_remote: isRemote ? 1 : 0,
          is_india: isIndia ? 1 : 0,
          stipend: job.salary || '',
          apply_link: applyLink,
          source: 'Jooble',
          posted_date: job.updated || '',
          tags: autoTag(title, job.snippet).join(', '),
          hash,
        });
      }
    } catch (err) {
      console.error('Jooble fetch error:', err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}
