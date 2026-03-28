import md5 from 'md5';

export function generateHash(company: string, title: string, applyLink: string): string {
  const raw = `${company.toLowerCase().trim()}|${title.toLowerCase().trim()}|${(applyLink || '').toLowerCase().trim()}`;
  return md5(raw);
}
