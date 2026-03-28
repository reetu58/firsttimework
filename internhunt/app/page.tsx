'use client';

import { useState, useEffect } from 'react';
import { useInternships } from '@/hooks/useInternships';
import { useSaved } from '@/hooks/useSaved';
import { useFilters } from '@/hooks/useFilters';
import StatsBar from '@/components/StatsBar';
import FilterBar from '@/components/FilterBar';
import InternshipCard from '@/components/InternshipCard';

export default function Dashboard() {
  const { filters, setSearch, setLocation, setCategory, setStipend, setSort, toggleSource, setPage, clearAll, activeCount } = useFilters();
  const { data, total, totalPages, stats, loading, error, refetch } = useInternships(filters);
  const { toggleSave, isSaved } = useSaved();
  const [fetching, setFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [firstLoad, setFirstLoad] = useState(true);

  // Auto-fetch on first load if database is empty
  useEffect(() => {
    if (firstLoad && !loading && stats.total === 0) {
      setFirstLoad(false);
      handleRefresh();
    } else if (!loading) {
      setFirstLoad(false);
    }
  }, [loading, stats.total, firstLoad]);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleString());
  }, [data]);

  async function handleRefresh() {
    setFetching(true);
    try {
      await fetch('/api/fetch-all', { method: 'POST' });
      await refetch();
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            Last updated: {lastUpdated || 'Never'}
            {fetching && (
              <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={fetching}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          {fetching ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Fetching...
            </>
          ) : (
            <>&#x1F504; Refresh Now</>
          )}
        </button>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} loading={loading} />

      {/* Filters */}
      <FilterBar
        onSearchChange={setSearch}
        onLocationChange={setLocation}
        onCategoryChange={setCategory}
        onStipendChange={setStipend}
        onSortChange={setSort}
        onSourceToggle={toggleSource}
        onClearAll={clearAll}
        activeCount={activeCount}
        selectedSources={filters.sources}
        currentCategory={filters.category}
        currentLocation={filters.location}
        currentStipend={filters.stipend}
        currentSort={filters.sort}
      />

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          Error: {error}
        </div>
      )}

      {/* Results info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? 'Loading...' : `${total} internship${total !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="skeleton w-10 h-10 rounded-lg"></div>
                <div className="flex-1">
                  <div className="skeleton h-4 w-3/4 mb-2"></div>
                  <div className="skeleton h-3 w-1/2"></div>
                </div>
              </div>
              <div className="skeleton h-3 w-full mb-2"></div>
              <div className="skeleton h-3 w-2/3 mb-4"></div>
              <div className="flex gap-2">
                <div className="skeleton h-5 w-16 rounded-full"></div>
                <div className="skeleton h-5 w-20 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">&#x1F50D;</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No internships found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {stats.total === 0
              ? 'Click "Refresh Now" to fetch internships from all sources.'
              : 'Try adjusting your filters to see more results.'}
          </p>
          {stats.total === 0 && (
            <button
              onClick={handleRefresh}
              disabled={fetching}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              &#x1F504; Fetch Internships
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((internship) => (
            <InternshipCard
              key={internship.id}
              internship={internship}
              isSaved={isSaved(internship.id)}
              onToggleSave={() => toggleSave(internship)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(filters.page - 1)}
            disabled={filters.page <= 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            &larr; Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (filters.page <= 4) {
              pageNum = i + 1;
            } else if (filters.page >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = filters.page - 3 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  filters.page === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setPage(filters.page + 1)}
            disabled={filters.page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
