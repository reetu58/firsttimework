import axios from 'axios';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

export async function scrapeReed(): Promise<Internship[]> {
  const apiKey = process.env.REED_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    console.warn('Reed: API key not configured, skipping');
    return [];
  }

  const results: Internship[] = [];

  try {
    const auth = Buffer.from(`${apiKey}:`).toString('base64');
    const { data } = await axios.get(
      'https://www.reed.co.uk/api/1.0/search?keywords=software+intern&locationName=Remote&resultsToTake=100',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 15000,
      }
    );

    const jobs = data.results || [];
    for (const job of jobs) {
      const title = job.jobTitle || '';
      if (shouldExclude(title)) continue;

      const company = job.employerName || 'Unknown';
      const applyLink = job.jobUrl || '';
      const hash = generateHash(company, title, applyLink);
      const location = job.locationName || 'Remote';
      const { isRemote, isIndia } = detectLocation(location);

      results.push({
        title,
        company,
        location,
        is_remote: isRemote ? 1 : 0,
        is_india: isIndia ? 1 : 0,
        stipend: job.minimumSalary ? `£${job.minimumSalary}-${job.maximumSalary}` : '',
        apply_link: applyLink,
        source: 'Reed',
        posted_date: job.date || '',
        tags: autoTag(title, job.jobDescription).join(', '),
        hash,
      });
    }
  } catch (err) {
    console.error('Reed fetch error:', err);
  }

  return results;
}
