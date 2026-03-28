import axios from 'axios';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
};

export async function scrapeAdzuna(): Promise<Internship[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  if (!appId || !apiKey || appId === 'your_app_id_here') {
    console.warn('Adzuna: API keys not configured, skipping');
    return [];
  }

  const queries = ['software+intern', 'developer+internship', 'AI+ML+intern'];
  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const q of queries) {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${apiKey}&results_per_page=50&what=${q}&content-type=application/json`;
      const { data } = await axios.get(url, { headers, timeout: 15000 });
      const jobs = data.results || [];

      for (const job of jobs) {
        const title = job.title || '';
        if (shouldExclude(title)) continue;

        const company = job.company?.display_name || 'Unknown';
        const applyLink = job.redirect_url || '';
        const hash = generateHash(company, title, applyLink);

        if (seen.has(hash)) continue;
        seen.add(hash);

        const location = job.location?.display_name || 'India';
        const { isRemote, isIndia } = detectLocation(location);

        results.push({
          title,
          company,
          location,
          is_remote: isRemote ? 1 : 0,
          is_india: isIndia || 1 ? 1 : 0,
          stipend: job.salary_min ? `₹${Math.round(job.salary_min)}/month` : '',
          apply_link: applyLink,
          source: 'Adzuna',
          posted_date: job.created || '',
          tags: autoTag(title, job.description).join(', '),
          hash,
        });
      }
    } catch (err) {
      console.error('Adzuna fetch error:', err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}
