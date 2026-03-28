import axios from 'axios';
import * as cheerio from 'cheerio';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude } from '../tagger';

const URLS = [
  'https://unstop.com/internships?oppType=internship&domain=Engineering%2FTechnology',
  'https://unstop.com/internships?oppType=internship&domain=Computer+Science',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
};

export async function scrapeUnstop(): Promise<Internship[]> {
  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 20000 });
      const $ = cheerio.load(data);

      $('[class*="card"], [class*="opportunity"], .single_profile').each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, .title, [class*="title"]').first().text().trim();
        const company = $el.find('[class*="company"], [class*="org"], .subtitle').first().text().trim();
        const stipend = $el.find('[class*="stipend"], [class*="prize"]').first().text().trim();
        const deadline = $el.find('[class*="deadline"], [class*="date"]').first().text().trim();
        const linkEl = $el.find('a[href*="/internship"]').first();
        const applyLink = linkEl.attr('href')
          ? (linkEl.attr('href')!.startsWith('http') ? linkEl.attr('href')! : `https://unstop.com${linkEl.attr('href')}`)
          : url;

        if (!title) return;
        if (shouldExclude(title)) return;

        const hash = generateHash(company || 'Unstop', title, applyLink);
        if (seen.has(hash)) return;
        seen.add(hash);

        results.push({
          title,
          company: company || 'Unknown',
          location: 'India',
          is_remote: 0,
          is_india: 1,
          stipend: stipend || '',
          deadline: deadline || '',
          apply_link: applyLink,
          source: 'Unstop',
          posted_date: '',
          tags: autoTag(title).join(', '),
          hash,
        });
      });
    } catch (err) {
      console.error('Unstop fetch error:', err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}
