'use client';

const TAG_COLORS: Record<string, string> = {
  'AI/ML': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'Web Dev': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'Mobile': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'Data': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  'DevOps': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'Security': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  'Open Source': 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  'Game Dev': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  'Blockchain': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  'Software': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function TagPill({ tag }: { tag: string }) {
  const trimmed = tag.trim();
  const colorClass = TAG_COLORS[trimmed] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {trimmed}
    </span>
  );
}
