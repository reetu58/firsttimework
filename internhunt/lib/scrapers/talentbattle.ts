import axios from 'axios';
import * as cheerio from 'cheerio';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude } from '../tagger';

const URL = 'https://talentbattle.in/Jobs/internship-jobs-in-india';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Connection': 'keep-alive',
};

export async function scrapeTalentBattle(): Promise<Internship[]> {
  const results: Internship[] = [];

  try {
    const { data } = await axios.get(URL, { headers, timeout: 20000 });
    const $ = cheerio.load(data);

    $('[class*="job-card"], [class*="card"], tr, .job-listing').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h3, h4, .title, td:first-child a').first().text().trim();
      const company = $el.find('.company, td:nth-child(2)').first().text().trim();
      const location = $el.find('.location, td:nth-child(3)').first().text().trim();
      const linkEl = $el.find('a[href]').first();
      const applyLink = linkEl.attr('href')
        ? (linkEl.attr('href')!.startsWith('http') ? linkEl.attr('href')! : `https://talentbattle.in${linkEl.attr('href')}`)
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
        stipend: '',
        apply_link: applyLink,
        source: 'TalentBattle',
        posted_date: '',
        tags: autoTag(title).join(', '),
        hash,
      });
    });
  } catch (err) {
    console.error('TalentBattle fetch error:', err);
  }

  return results;
}
