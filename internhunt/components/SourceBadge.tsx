'use client';

const SOURCE_COLORS: Record<string, string> = {
  'Internshala': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'LinkedIn': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'Remotive': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'Naukri': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'GitHub Lists': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'HackerNews': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'Wellfound': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  'Y Combinator': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'The Muse': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'Unstop': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Devfolio': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'Adzuna': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  'Jooble': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  'Reed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Google CSE': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Arbeitnow': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  'Jobicy': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'TalentBattle': 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
  'Shine': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'Fresherworld': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

export default function SourceBadge({ source }: { source: string }) {
  const colorClass = SOURCE_COLORS[source] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {source}
    </span>
  );
}
