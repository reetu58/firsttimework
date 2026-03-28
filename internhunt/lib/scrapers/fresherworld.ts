import axios from 'axios';
import * as cheerio from 'cheerio';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude } from '../tagger';

const URL = 'https://www.fresherworld.com/jobs/internship-cs-it-software';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
};

export async function scrapeFresherworld(): Promise<Internship[]> {
  const results: Internship[] = [];

  try {
    const { data } = await axios.get(URL, { headers, timeout: 20000 });
    const $ = cheerio.load(data);

    $('[class*="job"], tr, .listing-card, .card').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, h4, .title, td:first-child').first().text().trim();
      const company = $el.find('.company, td:nth-child(2), [class*="company"]').first().text().trim();
      const location = $el.find('.location, td:nth-child(3), [class*="location"]').first().text().trim();
      const linkEl = $el.find('a[href]').first();
      const applyLink = linkEl.attr('href')
        ? (linkEl.attr('href')!.startsWith('http') ? linkEl.attr('href')! : `https://www.fresherworld.com${linkEl.attr('href')}`)
        : URL;

      if (!title || title.length < 5) return;
      if (shouldExclude(title)) return;

      const hash = generateHash(company || 'Unknown', title, applyLink);

      results.push({
        title,
        company: company || 'Unknown',
        location: location || 'India',
        is_remote: 0,
        is_india: 1,
        stipend: '',
        apply_link: applyLink,
        source: 'Fresherworld',
        posted_date: '',
        tags: autoTag(title).join(', '),
        hash,
      });
    });
  } catch (err) {
    console.error('Fresherworld fetch error:', err);
  }

  return results;
}
