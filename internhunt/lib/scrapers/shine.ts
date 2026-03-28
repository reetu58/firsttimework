import axios from 'axios';
import * as cheerio from 'cheerio';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude } from '../tagger';

const URL = 'https://www.shine.com/job-search/software-developer-internship-jobs-in-india/';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
};

export async function scrapeShine(): Promise<Internship[]> {
  const results: Internship[] = [];

  try {
    const { data } = await axios.get(URL, { headers, timeout: 20000 });
    const $ = cheerio.load(data);

    $('[class*="job_card"], [class*="jobCard"], .job-card, .search_listing').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, .title, [class*="designation"]').first().text().trim();
      const company = $el.find('.company_name, [class*="company"], .comp_name').first().text().trim();
      const location = $el.find('.loc, [class*="location"]').first().text().trim();
      const salary = $el.find('[class*="salary"]').first().text().trim();
      const linkEl = $el.find('a[href]').first();
      const applyLink = linkEl.attr('href')
        ? (linkEl.attr('href')!.startsWith('http') ? linkEl.attr('href')! : `https://www.shine.com${linkEl.attr('href')}`)
        : URL;

      if (!title || title.length < 3) return;
      if (shouldExclude(title)) return;

      const hash = generateHash(company || 'Unknown', title, applyLink);

      results.push({
        title,
        company: company || 'Unknown',
        location: location || 'India',
        is_remote: 0,
        is_india: 1,
        stipend: salary || '',
        apply_link: applyLink,
        source: 'Shine',
        posted_date: '',
        tags: autoTag(title).join(', '),
        hash,
      });
    });
  } catch (err) {
    console.error('Shine fetch error:', err);
  }

  return results;
}
