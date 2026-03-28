'use client';

import { InternshipData } from '@/hooks/useInternships';
import SourceBadge from './SourceBadge';
import TagPill from './TagPill';

interface InternshipCardProps {
  internship: InternshipData;
  isSaved: boolean;
  onToggleSave: () => void;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function isNew(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  return (new Date().getTime() - date.getTime()) < 24 * 60 * 60 * 1000;
}

function getInitials(company: string): string {
  return company.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function getCompanyDomain(company: string): string {
  return company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
}

export default function InternshipCard({ internship, isSaved, onToggleSave }: InternshipCardProps) {
  const tags = (internship.tags || '').split(',').map(t => t.trim()).filter(Boolean);
  const posted = timeAgo(internship.fetched_at || internship.posted_date);
  const isNewPost = isNew(internship.fetched_at);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={`https://logo.clearbit.com/${getCompanyDomain(internship.company)}`}
            alt=""
            className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center text-white font-bold text-sm hidden"
          >
            {getInitials(internship.company)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
              {internship.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{internship.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isNewPost && (
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">New</span>
          )}
          <button
            onClick={onToggleSave}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title={isSaved ? 'Remove bookmark' : 'Bookmark'}
          >
            {isSaved ? (
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {internship.is_remote ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            &#x1F310; Remote
          </span>
        ) : internship.is_india ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            &#x1F1EE;&#x1F1F3; {internship.location || 'India'}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            &#x1F4CD; {internship.location || 'Unknown'}
          </span>
        )}

        {internship.stipend && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            internship.stipend.toLowerCase() === 'unpaid' || !internship.stipend
              ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
          }`}>
            &#x1F4B0; {internship.stipend}
          </span>
        )}

        {internship.duration && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            &#x23F1;&#xFE0F; {internship.duration}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {tags.slice(0, 4).map(tag => (
          <TagPill key={tag} tag={tag} />
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <SourceBadge source={internship.source} />
          {posted && <span className="text-xs text-gray-500 dark:text-gray-400">&#x1F5D3;&#xFE0F; {posted}</span>}
        </div>
        <a
          href={internship.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Apply &rarr;
        </a>
      </div>
    </div>
  );
}
