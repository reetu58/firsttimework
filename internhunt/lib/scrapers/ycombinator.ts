import axios from 'axios';
import * as cheerio from 'cheerio';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const URL = 'https://www.workatastartup.com/jobs?jobType=intern&role=eng';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
};

export async function scrapeYCombinator(): Promise<Internship[]> {
  const results: Internship[] = [];

  try {
    const { data } = await axios.get(URL, { headers, timeout: 20000 });
    const $ = cheerio.load(data);

    $('[class*="job-listing"], [class*="company-row"], .job-row, [class*="JobListing"]').each((_, el) => {
      const $el = $(el);
      const title = $el.find('[class*="role"], [class*="title"], h2, h3').first().text().trim();
      const company = $el.find('[class*="company"], [class*="name"]').first().text().trim();
      const location = $el.find('[class*="location"]').first().text().trim();
      const salary = $el.find('[class*="salary"], [class*="compensation"]').first().text().trim();
      const linkEl = $el.find('a[href]').first();
      const applyLink = linkEl.attr('href')
        ? (linkEl.attr('href')!.startsWith('http') ? linkEl.attr('href')! : `https://www.workatastartup.com${linkEl.attr('href')}`)
        : URL;

      if (!title) return;
      if (shouldExclude(title)) return;

      const { isRemote, isIndia } = detectLocation(location);
      if (!isRemote && !isIndia) return;

      const hash = generateHash(company || 'Unknown', title, applyLink);

      results.push({
        title,
        company: company || 'Unknown',
        location: location || 'Remote',
        is_remote: isRemote ? 1 : 0,
        is_india: isIndia ? 1 : 0,
        stipend: salary || '',
        apply_link: applyLink,
        source: 'Y Combinator',
        posted_date: '',
        tags: autoTag(title).join(', '),
        hash,
      });
    });
  } catch (err) {
    console.error('Y Combinator fetch error:', err);
  }

  return results;
}
