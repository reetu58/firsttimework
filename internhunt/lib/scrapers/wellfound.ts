import axios from 'axios';
import * as cheerio from 'cheerio';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const URLS = [
  'https://wellfound.com/jobs?jobType=internship&role=engineer&remote=true',
  'https://wellfound.com/jobs?jobType=internship&role=engineer&locationId=1608&remote=false',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
};

export async function scrapeWellfound(): Promise<Internship[]> {
  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 20000 });
      const $ = cheerio.load(data);

      $('[class*="styles_result"], [class*="job-listing"], [class*="StartupResult"]').each((_, el) => {
        const $el = $(el);
        const title = $el.find('[class*="title"], h2, h3').first().text().trim();
        const company = $el.find('[class*="company"], [class*="startup-name"]').first().text().trim();
        const location = $el.find('[class*="location"]').first().text().trim();
        const salary = $el.find('[class*="salary"], [class*="compensation"]').first().text().trim();
        const linkEl = $el.find('a[href*="/jobs/"], a[href*="/company/"]').first();
        const applyLink = linkEl.attr('href')
          ? (linkEl.attr('href')!.startsWith('http') ? linkEl.attr('href')! : `https://wellfound.com${linkEl.attr('href')}`)
          : url;

        if (!title) return;
        if (shouldExclude(title)) return;

        const hash = generateHash(company || 'Unknown', title, applyLink);
        if (seen.has(hash)) return;
        seen.add(hash);

        const { isRemote, isIndia } = detectLocation(location);

        results.push({
          title,
          company: company || 'Unknown',
          location: location || (url.includes('remote=true') ? 'Remote' : 'India'),
          is_remote: isRemote || url.includes('remote=true') ? 1 : 0,
          is_india: isIndia || url.includes('1608') ? 1 : 0,
          stipend: salary || '',
          apply_link: applyLink,
          source: 'Wellfound',
          posted_date: '',
          tags: autoTag(title).join(', '),
          hash,
        });
      });
    } catch (err) {
      console.error('Wellfound fetch error:', err);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  return results;
}
