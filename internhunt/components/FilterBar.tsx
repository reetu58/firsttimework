'use client';

import { useState } from 'react';

const ALL_SOURCES = [
  'Remotive', 'Arbeitnow', 'The Muse', 'Jobicy', 'Adzuna',
  'Jooble', 'Reed', 'HackerNews', 'GitHub Lists', 'Google CSE',
  'Internshala', 'Unstop', 'TalentBattle', 'Naukri', 'Shine',
  'Fresherworld', 'LinkedIn', 'Wellfound', 'Y Combinator', 'Devfolio',
];

const CATEGORIES = ['All', 'AI/ML', 'Web Dev', 'Mobile', 'Data', 'DevOps', 'Security', 'Blockchain', 'Open Source', 'Game Dev'];

interface FilterBarProps {
  onSearchChange: (val: string) => void;
  onLocationChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onStipendChange: (val: string) => void;
  onSortChange: (val: string) => void;
  onSourceToggle: (val: string) => void;
  onClearAll: () => void;
  activeCount: number;
  selectedSources: string[];
  currentCategory: string;
  currentLocation: string;
  currentStipend: string;
  currentSort: string;
}

export default function FilterBar(props: FilterBarProps) {
  const [showSources, setShowSources] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="mb-6">
      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">&#x1F50D;</span>
        <input
          type="text"
          placeholder="Search by title, company, or tags..."
          onChange={(e) => props.onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Mobile filter toggle */}
      <button
        className="md:hidden w-full mb-3 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium"
        onClick={() => setShowMobileFilters(!showMobileFilters)}
      >
        Filters {props.activeCount > 0 && `(${props.activeCount})`}
        <svg className={`w-4 h-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter controls */}
      <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block space-y-3`}>
        <div className="flex flex-wrap gap-3">
          {/* Location */}
          <select
            value={props.currentLocation}
            onChange={(e) => props.onLocationChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            <option value="">&#x1F4CD; All Locations</option>
            <option value="remote">&#x1F310; Remote Only</option>
            <option value="india">&#x1F1EE;&#x1F1F3; India Only</option>
          </select>

          {/* Stipend */}
          <select
            value={props.currentStipend}
            onChange={(e) => props.onStipendChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            <option value="">&#x1F4B0; Any Stipend</option>
            <option value="paid">Paid Only</option>
            <option value="unpaid">Unpaid Only</option>
          </select>

          {/* Sort */}
          <select
            value={props.currentSort}
            onChange={(e) => props.onSortChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            <option value="newest">&#x1F4C5; Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="company">Company A&rarr;Z</option>
            <option value="stipend">Stipend High&rarr;Low</option>
          </select>

          {/* Source filter button */}
          <button
            onClick={() => setShowSources(!showSources)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white flex items-center gap-1"
          >
            &#x1F4CA; Sources
            {props.selectedSources.length > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5">{props.selectedSources.length}</span>
            )}
          </button>

          {/* Clear all */}
          {props.activeCount > 0 && (
            <button
              onClick={props.onClearAll}
              className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              {props.activeCount} filters active &times; Clear all
            </button>
          )}
        </div>

        {/* Category tags */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => props.onCategoryChange(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                props.currentCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Source checkboxes */}
        {showSources && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {ALL_SOURCES.map(source => (
                <label key={source} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={props.selectedSources.includes(source)}
                    onChange={() => props.onSourceToggle(source)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{source}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
