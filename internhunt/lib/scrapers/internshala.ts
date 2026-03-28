import axios from 'axios';
import * as cheerio from 'cheerio';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const URLS = [
  'https://internshala.com/internships/computer-science-internship/',
  'https://internshala.com/internships/web-development-internship/',
  'https://internshala.com/internships/machine-learning-internship/',
  'https://internshala.com/internships/android-development-internship/',
  'https://internshala.com/internships/data-science-internship/',
  'https://internshala.com/internships/work-from-home-internship/',
  'https://internshala.com/internships/python-internship/',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
};

export async function scrapeInternshala(): Promise<Internship[]> {
  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const url of URLS) {
    try {
      const { data } = await axios.get(url, { headers, timeout: 20000 });
      const $ = cheerio.load(data);

      $('.individual_internship, .internship_meta, [class*="internship"]').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.job-internship-name a, .profile a, h3 a, .heading_4_5 a').first().text().trim();
        const company = $el.find('.company_name a, .company-name, .heading_6').first().text().trim();
        const location = $el.find('.locations span, .location_link, #location_names span').first().text().trim();
        const stipend = $el.find('.stipend, .desktop-text .stipend').first().text().trim();
        const duration = $el.find('.item_body:contains("Months"), .item_body:contains("Month")').first().text().trim();
        const linkEl = $el.find('a[href*="/internship/"]').first();
        const applyLink = linkEl.attr('href') ? `https://internshala.com${linkEl.attr('href')}` : url;

        if (!title || !company) return;
        if (shouldExclude(title)) return;

        const hash = generateHash(company, title, applyLink);
        if (seen.has(hash)) return;
        seen.add(hash);

        const { isRemote, isIndia } = detectLocation(location || 'India');

        results.push({
          title,
          company,
          location: location || 'India',
          is_remote: isRemote ? 1 : 0,
          is_india: 1,
          duration: duration || '',
          stipend: stipend || '',
          apply_link: applyLink,
          source: 'Internshala',
          posted_date: '',
          tags: autoTag(title).join(', '),
          hash,
        });
      });
    } catch (err) {
      console.error(`Internshala fetch error for ${url}:`, err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}
