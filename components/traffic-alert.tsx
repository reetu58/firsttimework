'use client';

import { TrafficAlert } from '../types';

interface Props {
  alert: TrafficAlert;
}

const SEVERITY_CONFIG = {
  clear: { dot: 'bg-emerald-400', bg: 'bg-emerald-50 border border-emerald-100', text: 'text-emerald-700', label: 'Smooth ride' },
  light: { dot: 'bg-amber-400', bg: 'bg-amber-50 border border-amber-100', text: 'text-amber-700', label: 'Slightly slow' },
  moderate: { dot: 'bg-orange-400', bg: 'bg-orange-50 border border-orange-100', text: 'text-orange-700', label: 'Moderate traffic' },
  heavy: { dot: 'bg-red-500', bg: 'bg-red-50 border border-red-200', text: 'text-red-700', label: 'Heavy traffic' },
  standstill: { dot: 'bg-red-600', bg: 'bg-red-100 border border-red-200', text: 'text-red-800', label: 'Standstill' },
} as const;

export default function TrafficAlertCard({ alert }: Props) {
  const {
    from, to, currentTravelTime, normalTravelTime, delayMinutes,
    severity, incidents, alternative, bestDepartureWindow, isLive,
  } = alert;

  const config = SEVERITY_CONFIG[severity];

  return (
    <div className={`rounded-2xl px-4 py-3.5 ${config.bg}`}>
      {/* Route */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-800">{from}</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400" viewBox="0 0 12 12">
            <path d="M2 6h8M7 3l3 3-3 3" />
          </svg>
          <span className="font-semibold text-slate-800">{to}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium bg-white/60 px-2 py-0.5 rounded-full">
          {isLive ? 'Live' : 'Estimated'}
        </span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${config.dot} ${severity === 'heavy' || severity === 'standstill' ? 'animate-pulse' : ''}`} />
          <span className={`font-semibold text-sm ${config.text}`}>{config.label}</span>
        </div>
        <span className="text-sm text-slate-600">{Math.round(currentTravelTime)} min</span>
        {delayMinutes > 0 && (
          <>
            <span className="text-xs text-slate-400 line-through">{Math.round(normalTravelTime)} min</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
              severity === 'heavy' || severity === 'standstill'
                ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-600'
            }`}>
              +{Math.round(delayMinutes)}m
            </span>
          </>
        )}
      </div>

      {/* Incidents */}
      {incidents.length > 0 && (
        <div className="space-y-1 mb-2">
          {incidents.map((inc, i) => (
            <p key={i} className="text-xs text-slate-600 bg-white/50 px-2.5 py-1.5 rounded-lg">
              {inc.type}: {inc.description}
            </p>
          ))}
        </div>
      )}

      {/* Alternative */}
      {alternative && (
        <div className="flex items-start gap-2 text-xs bg-white/60 rounded-xl p-2.5 mb-1.5">
          <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-blue-500 text-[10px] font-bold">?</span>
          <div>
            <span className="font-semibold text-primary">Consider {alternative.placeName}</span>
            <span className="text-slate-500"> — {Math.round(alternative.travelTime)} min away. {alternative.reason}</span>
          </div>
        </div>
      )}

      {/* Departure window */}
      {bestDepartureWindow && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {bestDepartureWindow}
        </p>
      )}
    </div>
  );
}
