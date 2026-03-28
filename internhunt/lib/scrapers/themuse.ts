import axios from 'axios';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const URLS = [
  'https://www.themuse.com/api/public/jobs?category=Software+Engineer&level=Internship&page=1',
  'https://www.themuse.com/api/public/jobs?category=Data+Science&level=Internship&page=1',
  'https://www.themuse.com/api/public/jobs?category=IT+%26+System+Administration&level=Internship&page=1',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
};

export async function scrapeTheMuse(): Promise<Internship[]> {
  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 15000 });
      const jobs = data.results || [];

      for (const job of jobs) {
        const title = job.name || '';
        if (shouldExclude(title)) continue;

        const locations = (job.locations || []).map((l: any) => l.name || '');
        const locStr = locations.join(', ');
        const hasValidLocation = locations.some((l: string) => {
          const lower = l.toLowerCase();
          return lower.includes('remote') || lower.includes('india') || lower.includes('flexible');
        });

        if (!hasValidLocation && locations.length > 0) continue;

        const company = job.company?.name || 'Unknown';
        const applyLink = job.refs?.landing_page || '';
        const hash = generateHash(company, title, applyLink);

        if (seen.has(hash)) continue;
        seen.add(hash);

        const { isRemote, isIndia } = detectLocation(locStr);

        results.push({
          title,
          company,
          location: locStr || 'Remote',
          is_remote: isRemote ? 1 : 0,
          is_india: isIndia ? 1 : 0,
          stipend: '',
          apply_link: applyLink,
          source: 'The Muse',
          posted_date: job.publication_date || '',
          tags: autoTag(title, job.contents).join(', '),
          hash,
        });
      }
    } catch (err) {
      console.error(`The Muse fetch error:`, err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}
