import axios from 'axios';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const URLS = [
  'https://remotive.com/api/remote-jobs?category=software-dev&limit=100',
  'https://remotive.com/api/remote-jobs?category=data&limit=100',
  'https://remotive.com/api/remote-jobs?category=devops&limit=100',
  'https://remotive.com/api/remote-jobs?category=product&limit=100',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

export async function scrapeRemotive(): Promise<Internship[]> {
  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 15000 });
      const jobs = data.jobs || [];

      for (const job of jobs) {
        const title = job.title || '';
        const jobType = (job.job_type || '').toLowerCase();
        const candidateLocation = (job.candidate_required_location || '').toLowerCase();

        // Must be internship
        if (!jobType.includes('internship') && !title.toLowerCase().includes('intern')) continue;

        // Location filter
        if (!['india', 'worldwide', 'anywhere', ''].some(l => candidateLocation.includes(l) || candidateLocation === '')) continue;

        if (shouldExclude(title)) continue;

        const company = job.company_name || 'Unknown';
        const applyLink = job.url || '';
        const hash = generateHash(company, title, applyLink);

        if (seen.has(hash)) continue;
        seen.add(hash);

        const loc = job.candidate_required_location || 'Remote';
        const { isRemote, isIndia } = detectLocation(loc);
        const tags = autoTag(title, job.description);

        results.push({
          title,
          company,
          location: loc,
          is_remote: isRemote || loc.toLowerCase().includes('worldwide') ? 1 : 0,
          is_india: isIndia ? 1 : 0,
          stipend: job.salary || '',
          apply_link: applyLink,
          source: 'Remotive',
          posted_date: job.publication_date || '',
          tags: tags.join(', '),
          hash,
        });
      }
    } catch (err) {
      console.error(`Remotive fetch error for ${url}:`, err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}
