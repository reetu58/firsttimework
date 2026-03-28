'use client';

import { useState, useEffect } from 'react';
import FetchLogTable from '@/components/FetchLogTable';

const ALL_SOURCES = [
  'Remotive', 'Arbeitnow', 'The Muse', 'Jobicy', 'Adzuna',
  'Jooble', 'Reed', 'HackerNews', 'GitHub Lists', 'Google CSE',
  'Internshala', 'Unstop', 'TalentBattle', 'Naukri', 'Shine',
  'Fresherworld', 'LinkedIn', 'Wellfound', 'Y Combinator', 'Devfolio',
];

export default function SettingsPage() {
  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>({});
  const [fetchingSource, setFetchingSource] = useState<string | null>(null);
  const [fetchingAll, setFetchingAll] = useState(false);
  const [fetchTime, setFetchTime] = useState('08:00');
  const [logKey, setLogKey] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('internhunt_sources');
    if (stored) {
      setEnabledSources(JSON.parse(stored));
    } else {
      const defaults: Record<string, boolean> = {};
      ALL_SOURCES.forEach(s => (defaults[s] = true));
      setEnabledSources(defaults);
    }
    const time = localStorage.getItem('internhunt_fetchtime');
    if (time) setFetchTime(time);
  }, []);

  function toggleSource(source: string) {
    const updated = { ...enabledSources, [source]: !enabledSources[source] };
    setEnabledSources(updated);
    localStorage.setItem('internhunt_sources', JSON.stringify(updated));
  }

  async function fetchSingle(source: string) {
    setFetchingSource(source);
    try {
      await fetch('/api/fetch-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      setLogKey(k => k + 1);
    } catch (err) {
      console.error(`Fetch ${source} failed:`, err);
    } finally {
      setFetchingSource(null);
    }
  }

  async function fetchAllSources() {
    setFetchingAll(true);
    try {
      await fetch('/api/fetch-all', { method: 'POST' });
      setLogKey(k => k + 1);
    } catch (err) {
      console.error('Fetch all failed:', err);
    } finally {
      setFetchingAll(false);
    }
  }

  async function clearDatabase() {
    if (!window.confirm('Are you sure you want to clear the entire database? This action cannot be undone.')) return;
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      setLogKey(k => k + 1);
      alert('Database cleared successfully.');
    } catch (err) {
      console.error('Clear failed:', err);
    }
  }

  function saveFetchTime(time: string) {
    setFetchTime(time);
    localStorage.setItem('internhunt_fetchtime', time);
  }

  return (
    <div className="pb-20 md:pb-0 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* Fetch Schedule */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fetch Schedule</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600 dark:text-gray-400">Daily auto-fetch at:</label>
          <input
            type="time"
            value={fetchTime}
            onChange={(e) => saveFetchTime(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">(IST)</span>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Note: The cron schedule runs at 8:00 AM IST by default on the server. This UI setting is for display only.
        </p>
      </section>

      {/* Sources */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Sources ({ALL_SOURCES.length})</h2>
          <button
            onClick={fetchAllSources}
            disabled={fetchingAll}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            {fetchingAll ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Fetching All...
              </>
            ) : (
              '&#x1F504; Fetch All Sources'
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_SOURCES.map((source) => (
            <div
              key={source}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={enabledSources[source] !== false}
                  onChange={() => toggleSource(source)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{source}</span>
              </label>
              <button
                onClick={() => fetchSingle(source)}
                disabled={fetchingSource === source}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium"
              >
                {fetchingSource === source ? (
                  <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Fetch'
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Fetch Logs */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fetch Logs (Last 7 Days)</h2>
        <FetchLogTable key={logKey} />
      </section>

      {/* Danger Zone */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-800 p-6">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This will permanently delete all internship data and fetch logs.
        </p>
        <button
          onClick={clearDatabase}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
        >
          &#x1F5D1; Clear Database
        </button>
      </section>
    </div>
  );
}
