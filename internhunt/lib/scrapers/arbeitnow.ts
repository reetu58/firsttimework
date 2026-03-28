import axios from 'axios';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const URL = 'https://arbeitnow.com/api/job-board-api';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
};

export async function scrapeArbeitnow(): Promise<Internship[]> {
  const results: Internship[] = [];

  try {
    const { data } = await axios.get(URL, { headers, timeout: 15000 });
    const jobs = data.data || [];

    for (const job of jobs) {
      const title = (job.title || '').toLowerCase();
      const tags_raw = (job.tags || []).join(' ').toLowerCase();
      const location = job.location || '';

      if (!title.includes('intern') && !tags_raw.includes('intern')) continue;

      const isRemoteJob = job.remote === true;
      const locationLower = location.toLowerCase();
      if (!isRemoteJob && !locationLower.includes('india')) continue;

      if (shouldExclude(job.title)) continue;

      const company = job.company_name || 'Unknown';
      const applyLink = job.url || '';
      const hash = generateHash(company, job.title, applyLink);
      const { isRemote, isIndia } = detectLocation(location);

      results.push({
        title: job.title,
        company,
        location: isRemoteJob ? 'Remote' : location,
        is_remote: isRemote || isRemoteJob ? 1 : 0,
        is_india: isIndia ? 1 : 0,
        stipend: '',
        apply_link: applyLink,
        source: 'Arbeitnow',
        posted_date: job.created_at || '',
        tags: autoTag(job.title, job.description).join(', '),
        hash,
      });
    }
  } catch (err) {
    console.error('Arbeitnow fetch error:', err);
  }

  return results;
}
