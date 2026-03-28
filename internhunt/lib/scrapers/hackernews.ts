import axios from 'axios';
import { Internship } from '../db';
import { generateHash } from '../dedup';
import { autoTag, shouldExclude, detectLocation } from '../tagger';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
};

export async function scrapeHackerNews(): Promise<Internship[]> {
  const results: Internship[] = [];

  try {
    // Step 1: Find latest "Who is hiring" thread
    const searchRes = await axios.get(
      'https://hn.algolia.com/api/v1/search?query=Ask+HN+Who+is+hiring&tags=story&hitsPerPage=1',
      { headers, timeout: 15000 }
    );

    const hits = searchRes.data.hits || [];
    if (hits.length === 0) return results;

    const storyId = hits[0].objectID;

    // Step 2: Fetch comments
    const commentsRes = await axios.get(
      `https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${storyId}&hitsPerPage=1000`,
      { headers, timeout: 30000 }
    );

    const comments = commentsRes.data.hits || [];

    for (const comment of comments) {
      const text = (comment.comment_text || '').toLowerCase();

      if (!text.includes('intern')) continue;
      if (!text.includes('india') && !text.includes('remote') && !text.includes('worldwide')) continue;

      // Extract company name (first line or first word)
      const rawText = comment.comment_text || '';
      const firstLine = rawText.replace(/<[^>]*>/g, '').split('\n')[0].trim();
      const company = firstLine.split('|')[0]?.trim().split(' ').slice(0, 3).join(' ') || 'HN Company';
      const title = 'Internship (from HN Who\'s Hiring)';

      // Try to find URL
      const urlMatch = rawText.match(/href="([^"]+)"/);
      const applyLink = urlMatch ? urlMatch[1] : `https://news.ycombinator.com/item?id=${comment.objectID}`;

      if (shouldExclude(firstLine)) continue;

      const hash = generateHash(company, title, applyLink);
      const { isRemote, isIndia } = detectLocation(rawText);

      results.push({
        title: `${company} - Internship`,
        company,
        location: isIndia ? 'India' : 'Remote',
        is_remote: isRemote ? 1 : 0,
        is_india: isIndia ? 1 : 0,
        stipend: '',
        apply_link: applyLink,
        source: 'HackerNews',
        posted_date: comment.created_at || '',
        tags: autoTag(firstLine, text).join(', '),
        hash,
      });
    }
  } catch (err) {
    console.error('HackerNews fetch error:', err);
  }

  return results;
}
