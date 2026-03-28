'use client';

import { Stats } from '@/hooks/useInternships';

interface StatsBarProps {
  stats: Stats;
  loading: boolean;
}

export default function StatsBar({ stats, loading }: StatsBarProps) {
  const cards = [
    { label: 'Total Active Listings', value: stats.total, icon: '&#x1F9F2;' },
    { label: 'Added Today', value: stats.today, icon: '&#x1F195;' },
    { label: 'Remote Listings', value: stats.remote, icon: '&#x1F310;' },
    { label: 'India-Based Listings', value: stats.india, icon: '&#x1F1EE;&#x1F1F3;' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
        >
          {loading ? (
            <div className="space-y-2">
              <div className="skeleton h-8 w-16"></div>
              <div className="skeleton h-4 w-24"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span dangerouslySetInnerHTML={{ __html: card.icon }} />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
