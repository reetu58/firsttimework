const TAG_RULES: Record<string, string[]> = {
  'AI/ML': ['ai', 'ml', 'machine learning', 'deep learning', 'llm', 'nlp', 'genai', 'computer vision', 'data science', 'artificial intelligence', 'neural', 'pytorch', 'tensorflow'],
  'Web Dev': ['react', 'vue', 'angular', 'node', 'django', 'flask', 'fastapi', 'fullstack', 'full stack', 'frontend', 'front end', 'backend', 'back end', 'web', 'javascript', 'typescript', 'html', 'css', 'next.js', 'express'],
  'Mobile': ['android', 'ios', 'flutter', 'react native', 'swift', 'kotlin', 'mobile app'],
  'Data': ['data analyst', 'data engineer', 'sql', 'spark', 'hadoop', 'tableau', 'powerbi', 'etl', 'big data', 'pandas', 'numpy', 'analytics'],
  'DevOps': ['devops', 'cloud', 'aws', 'gcp', 'azure', 'kubernetes', 'docker', 'ci/cd', 'terraform', 'jenkins', 'linux', 'sre'],
  'Security': ['cybersecurity', 'security', 'penetration', 'ethical hacking', 'ctf', 'infosec'],
  'Open Source': ['open source', 'gsoc', 'outreachy', 'oss', 'contributing'],
  'Game Dev': ['unity', 'unreal', 'game', 'godot'],
  'Blockchain': ['web3', 'blockchain', 'solidity', 'crypto', 'smart contract'],
};

const EXCLUDE_KEYWORDS = [
  'nurse', 'sales executive', 'marketing manager', 'content writer',
  'graphic design', 'hr ', 'recruiter', 'accountant',
];

const EXCLUDE_OVERRIDE = ['ui/ux', 'ui ux', 'legaltech', 'fintech'];

export function autoTag(title: string, description?: string): string[] {
  const text = `${title} ${description || ''}`.toLowerCase();
  const tags: string[] = [];

  for (const [tag, keywords] of Object.entries(TAG_RULES)) {
    if (keywords.some(kw => text.includes(kw))) {
      tags.push(tag);
    }
  }

  if (tags.length === 0) {
    tags.push('Software');
  }

  return tags;
}

export function shouldExclude(title: string): boolean {
  const lower = title.toLowerCase();

  if (EXCLUDE_OVERRIDE.some(kw => lower.includes(kw))) {
    return false;
  }

  return EXCLUDE_KEYWORDS.some(kw => lower.includes(kw));
}

export function detectLocation(location: string): { isRemote: boolean; isIndia: boolean } {
  const lower = (location || '').toLowerCase();
  const isRemote = ['remote', 'work from home', 'wfh', 'anywhere', 'worldwide', 'global', 'distributed'].some(k => lower.includes(k));
  const indianCities = ['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'hyderabad', 'chennai', 'pune', 'kolkata', 'noida', 'gurgaon', 'gurugram', 'jaipur', 'ahmedabad', 'kochi', 'thiruvananthapuram', 'indore', 'chandigarh'];
  const isIndia = indianCities.some(c => lower.includes(c));
  return { isRemote, isIndia };
}
