import axios from 'axios';
import * as cheerio from 'cheerio';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude } from '../tagger';

const URL = 'https://devfolio.co/opportunities';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
};

export async function scrapeDevfolio(): Promise<Internship[]> {
  const results: Internship[] = [];

  try {
    const { data } = await axios.get(URL, { headers, timeout: 20000 });
    const $ = cheerio.load(data);

    $('[class*="opportunity"], [class*="card"], [class*="hackathon"]').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, [class*="title"], [class*="name"]').first().text().trim();
      const company = $el.find('[class*="organizer"], [class*="company"]').first().text().trim();
      const stipend = $el.find('[class*="prize"], [class*="stipend"]').first().text().trim();
      const linkEl = $el.find('a[href]').first();
      const applyLink = linkEl.attr('href')
        ? (linkEl.attr('href')!.startsWith('http') ? linkEl.attr('href')! : `https://devfolio.co${linkEl.attr('href')}`)
        : URL;

      if (!title || title.length < 3) return;
      if (shouldExclude(title)) return;

      const hash = generateHash(company || 'Devfolio', title, applyLink);

      results.push({
        title: `${title} (Hackathon→Intern)`,
        company: company || 'Devfolio',
        location: 'India',
        is_remote: 1,
        is_india: 1,
        stipend: stipend || '',
        apply_link: applyLink,
        source: 'Devfolio',
        posted_date: '',
        tags: [...autoTag(title), 'Hackathon→Intern'].join(', '),
        hash,
      });
    });
  } catch (err) {
    console.error('Devfolio fetch error:', err);
  }

  return results;
}
