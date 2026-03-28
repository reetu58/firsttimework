import axios from 'axios';
import * as cheerio from 'cheerio';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const URLS = [
  'https://www.naukri.com/internship-jobs-in-india',
  'https://www.naukri.com/software-developer-internship-jobs',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
};

export async function scrapeNaukri(): Promise<Internship[]> {
  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 20000 });
      const $ = cheerio.load(data);

      $('[class*="jobTuple"], [class*="srp-jobtuple"], article').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.title, [class*="title"], a.title').first().text().trim();
        const company = $el.find('.comp-name, [class*="companyName"], .subTitle').first().text().trim();
        const location = $el.find('.locWdth, [class*="location"], .loc').first().text().trim();
        const salary = $el.find('.salary, [class*="salary"]').first().text().trim();
        const linkEl = $el.find('a[href*="naukri.com"]').first();
        const applyLink = linkEl.attr('href') || url;

        if (!title || title.length < 3) return;
        if (shouldExclude(title)) return;

        const hash = generateHash(company || 'Unknown', title, applyLink);
        if (seen.has(hash)) return;
        seen.add(hash);

        const { isRemote, isIndia } = detectLocation(location || 'India');

        results.push({
          title,
          company: company || 'Unknown',
          location: location || 'India',
          is_remote: isRemote ? 1 : 0,
          is_india: 1,
          stipend: salary || '',
          apply_link: applyLink,
          source: 'Naukri',
          posted_date: '',
          tags: autoTag(title).join(', '),
          hash,
        });
      });
    } catch (err) {
      console.error('Naukri fetch error:', err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}
