import axios from 'axios';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const URLS = [
  'https://jobicy.com/api/v2/remote-jobs?industry=engineering&count=50',
  'https://jobicy.com/api/v2/remote-jobs?industry=design&count=50',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
};

export async function scrapeJobicy(): Promise<Internship[]> {
  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 15000 });
      const jobs = data.jobs || [];

      for (const job of jobs) {
        const title = (job.jobTitle || '').toLowerCase();
        if (!title.includes('intern') && !title.includes('trainee')) continue;
        if (shouldExclude(job.jobTitle)) continue;

        const company = job.companyName || 'Unknown';
        const applyLink = job.url || '';
        const hash = generateHash(company, job.jobTitle, applyLink);

        if (seen.has(hash)) continue;
        seen.add(hash);

        const location = job.jobGeo || 'Remote';
        const { isRemote, isIndia } = detectLocation(location);

        results.push({
          title: job.jobTitle,
          company,
          location,
          is_remote: isRemote ? 1 : 0,
          is_india: isIndia ? 1 : 0,
          stipend: job.annualSalaryMin ? `$${job.annualSalaryMin}-${job.annualSalaryMax}` : '',
          apply_link: applyLink,
          source: 'Jobicy',
          posted_date: job.pubDate || '',
          tags: autoTag(job.jobTitle, job.jobExcerpt).join(', '),
          hash,
        });
      }
    } catch (err) {
      console.error('Jobicy fetch error:', err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}
