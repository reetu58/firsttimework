'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  id: number;
  source: string;
  fetched_at: string;
  count_added: number;
  count_skipped: number;
  status: string;
  error_message: string;
}

export default function FetchLogTable() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/logs')
      .then(r => r.json())
      .then(data => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="skeleton h-48 w-full rounded-lg"></div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No fetch logs yet. Run a fetch to see results.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Source</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Time</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Added</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Skipped</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Error</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 px-4 font-medium text-gray-900 dark:text-white">{log.source}</td>
              <td className="py-2 px-4 text-gray-600 dark:text-gray-400">
                {new Date(log.fetched_at).toLocaleString()}
              </td>
              <td className="py-2 px-4">
                <span className="text-green-600 dark:text-green-400 font-medium">+{log.count_added}</span>
              </td>
              <td className="py-2 px-4 text-gray-500">{log.count_skipped}</td>
              <td className="py-2 px-4">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  log.status === 'success'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : log.status === 'failed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {log.status}
                </span>
              </td>
              <td className="py-2 px-4 text-red-500 text-xs max-w-xs truncate">{log.error_message || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
