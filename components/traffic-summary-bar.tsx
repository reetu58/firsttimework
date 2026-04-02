'use client';
import { TrafficSeverity } from '../types';

interface Props {
  stops: Array<{ emoji: string; name: string }>;
  totalDuration: number;
  totalTravelTime: number;
  totalTrafficOverhead: number;
  totalCost: { min: number; max: number };
  overallSeverity: TrafficSeverity;
  onRefresh: () => void;
  onShare: () => void;
  isRefreshing?: boolean;
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const SEVERITY_DOT: Record<TrafficSeverity, string> = {
  clear: 'severity-clear',
  light: 'severity-light',
  moderate: 'severity-moderate',
  heavy: 'severity-heavy',
  standstill: 'severity-standstill',
};

export default function TrafficSummaryBar({
  stops, totalDuration, totalTravelTime, totalTrafficOverhead,
  totalCost, overallSeverity, onRefresh, onShare, isRefreshing,
}: Props) {
  return (
    <div className="sticky top-16 z-40 glass border-b border-slate-200/50 px-4 py-3">
      <div className="max-w-5xl mx-auto">
        {/* Route visualization */}
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto hide-scrollbar">
          {stops.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5 flex-shrink-0">
              {i > 0 && (
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300" viewBox="0 0 12 12">
                  <path d="M2 6h8M7 3l3 3-3 3" />
                </svg>
              )}
              <span className="text-xs font-medium text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-100">
                {s.emoji} {s.name}
              </span>
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-primary">{formatDuration(totalDuration)}</span>
            <span className="text-slate-400">total</span>
          </div>

          <div className="w-px h-3 bg-slate-200" />

          <div className="flex items-center gap-1.5">
            <span className={`severity-dot ${SEVERITY_DOT[overallSeverity]}`} />
            <span className="text-slate-500">{formatDuration(totalTravelTime)} travel</span>
            {totalTrafficOverhead > 0 && (
              <span className={`font-semibold ${totalTrafficOverhead > 10 ? 'text-red-500' : 'text-amber-500'}`}>
                +{totalTrafficOverhead}m
              </span>
            )}
          </div>

          <div className="w-px h-3 bg-slate-200" />

          <span className="text-slate-500">
            {totalCost.min === 0 && totalCost.max === 0 ? 'Free' : `₹${totalCost.min}-${totalCost.max}`}
          </span>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-[11px] font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {isRefreshing ? (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 border-1.5 border-white/30 border-t-white rounded-full animate-spin" />
                  Refreshing
                </span>
              ) : 'Refresh'}
            </button>
            <button
              onClick={onShare}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-primary rounded-lg text-[11px] font-bold hover:shadow-glow transition-all"
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
