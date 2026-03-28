import axios from 'axios';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const QUERIES = [
  'software engineering internship India May 2026 site:linkedin.com',
  'remote software intern 2026 India',
  'AI ML internship India 2026 apply',
];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
};

export async function scrapeGoogleCSE(): Promise<Internship[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId || apiKey === 'your_key_here') {
    console.warn('Google CSE: API keys not configured, skipping');
    return [];
  }

  const results: Internship[] = [];
  const seen = new Set<string>();

  for (const query of QUERIES) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}&num=10`;
      const { data } = await axios.get(url, { headers, timeout: 15000 });
      const items = data.items || [];

      for (const item of items) {
        const title = item.title || '';
        const link = item.link || '';
        const snippet = item.snippet || '';

        if (shouldExclude(title)) continue;

        // Guess company from title
        const company = title.split(' - ')[0]?.split(' | ')[0]?.trim() || 'Unknown';
        const hash = generateHash(company, title, link);

        if (seen.has(hash)) continue;
        seen.add(hash);

        const { isRemote, isIndia } = detectLocation(`${title} ${snippet}`);

        results.push({
          title,
          company,
          location: isIndia ? 'India' : isRemote ? 'Remote' : 'India',
          is_remote: isRemote ? 1 : 0,
          is_india: isIndia ? 1 : 0,
          stipend: '',
          apply_link: link,
          source: 'Google CSE',
          posted_date: '',
          tags: autoTag(title, snippet).join(', '),
          hash,
        });
      }
    } catch (err) {
      console.error('Google CSE fetch error:', err);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  return results;
}
