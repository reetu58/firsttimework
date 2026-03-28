'use client';

import { useSaved } from '@/hooks/useSaved';
import InternshipCard from '@/components/InternshipCard';

export default function SavedPage() {
  const { saved, toggleSave, isSaved, clearAll, exportCsv } = useSaved();

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Internships</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{saved.length} bookmarked</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            disabled={saved.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium"
          >
            &#x1F4E5; Export to CSV
          </button>
          <button
            onClick={() => {
              if (window.confirm('Clear all saved internships?')) clearAll();
            }}
            disabled={saved.length === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium"
          >
            &#x1F5D1; Clear All
          </button>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">&#x1F516;</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No saved internships</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Bookmark internships from the dashboard to see them here.
          </p>
          <a href="/" className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            Go to Dashboard
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((internship) => (
            <InternshipCard
              key={internship.id}
              internship={internship}
              isSaved={isSaved(internship.id)}
              onToggleSave={() => toggleSave(internship)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
