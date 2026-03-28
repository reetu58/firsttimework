import axios from 'axios';
import * as cheerio from 'cheerio';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const URLS = [
  'https://www.linkedin.com/jobs/search/?keywords=software+intern&location=India&f_JT=I&f_TPR=r604800&f_E=1',
  'https://www.linkedin.com/jobs/search/?keywords=software+intern&f_WT=2&f_JT=I&f_TPR=r604800',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

export async function scrapeLinkedIn(): Promise<Internship[]> {
  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 20000 });
      const $ = cheerio.load(data);

      $('.job-search-card, .base-card, [class*="job-card"]').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.base-search-card__title, .job-search-card__title, h3').first().text().trim();
        const company = $el.find('.base-search-card__subtitle, .job-search-card__company-name, h4').first().text().trim();
        const location = $el.find('.job-search-card__location, .base-search-card__metadata span').first().text().trim();
        const linkEl = $el.find('a[href*="linkedin.com/jobs"]').first();
        const applyLink = linkEl.attr('href') || '';

        if (!title) return;
        if (shouldExclude(title)) return;

        const hash = generateHash(company || 'Unknown', title, applyLink);
        if (seen.has(hash)) return;
        seen.add(hash);

        const { isRemote, isIndia } = detectLocation(location);

        results.push({
          title,
          company: company || 'Unknown',
          location: location || 'India',
          is_remote: isRemote ? 1 : 0,
          is_india: isIndia || url.includes('location=India') ? 1 : 0,
          stipend: '',
          apply_link: applyLink,
          source: 'LinkedIn',
          posted_date: '',
          tags: autoTag(title).join(', '),
          hash,
        });
      });
    } catch (err) {
      console.error('LinkedIn fetch error:', err);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  return results;
}
