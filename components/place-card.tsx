'use client';
import { ItineraryStop, CATEGORY_ICONS, TrafficSeverity } from '../types';

const SEVERITY_CONFIG: Record<TrafficSeverity, { dot: string; bg: string; text: string; label: string }> = {
  clear: { dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', label: 'Smooth ride' },
  light: { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', label: 'Slightly slow' },
  moderate: { dot: 'bg-orange-400', bg: 'bg-orange-50 border-orange-100', text: 'text-orange-700', label: 'Moderate traffic' },
  heavy: { dot: 'bg-red-500', bg: 'bg-red-50 border-red-100', text: 'text-red-700', label: 'Heavy traffic' },
  standstill: { dot: 'bg-red-600', bg: 'bg-red-100 border-red-200', text: 'text-red-800', label: 'Standstill' },
};

const BUDGET_LABELS: Record<string, string> = {
  free: 'Free', 'under-500': 'Under ₹500', 'under-2000': 'Under ₹2K', 'no-limit': '₹₹₹',
};

interface Props {
  stop: ItineraryStop;
  isFirst: boolean;
  onSwap?: (placeId: string) => void;
  onCheckTraffic?: (placeId: string) => void;
  isCheckingTraffic?: boolean;
}

export default function PlaceCard({ stop, isFirst, onSwap, onCheckTraffic, isCheckingTraffic }: Props) {
  const { place, trafficAlert } = stop;
  const severity = trafficAlert?.severity || 'clear';
  const config = SEVERITY_CONFIG[severity];

  return (
    <div className="relative">
      {/* Timeline connector line */}
      {!isFirst && (
        <div className="absolute left-[19px] -top-4 h-4 w-0.5 bg-slate-200" />
      )}

      <div className="flex gap-4">
        {/* Timeline dot */}
        <div className="flex flex-col items-center flex-shrink-0 pt-1">
          <div className="number-badge text-sm">{stop.order}</div>
          <div className="w-0.5 flex-1 bg-slate-100 mt-2" />
        </div>

        {/* Card */}
        <div className="flex-1 card-premium overflow-hidden mb-4">
          {/* Traffic Alert */}
          {!isFirst && trafficAlert && (
            <div className={`px-4 py-3 border-b ${config.bg} flex items-center justify-between gap-2 flex-wrap`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${config.dot} ${severity === 'heavy' || severity === 'standstill' ? 'animate-pulse' : ''}`} />
                <span className={`text-sm font-semibold ${config.text}`}>
                  {config.label}
                </span>
                <span className="text-xs text-slate-500">
                  {Math.round(trafficAlert.currentTravelTime)} min
                  {trafficAlert.delayMinutes > 0 && (
                    <span className="text-slate-400 ml-1">
                      (+{Math.round(trafficAlert.delayMinutes)})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">
                  {trafficAlert.isLive ? 'Live' : 'Est.'}
                </span>
                {onCheckTraffic && (
                  <button
                    onClick={() => onCheckTraffic(place.id)}
                    disabled={isCheckingTraffic}
                    className="text-[10px] px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-primary hover:border-slate-300 transition-all disabled:opacity-50"
                  >
                    {isCheckingTraffic ? 'Checking...' : 'Refresh'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Place Content */}
          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-primary truncate">{place.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">
                    {CATEGORY_ICONS[place.category]} {place.category.replace('-', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">{place.area}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 ml-3 flex-shrink-0">
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {place.rating}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
              <span>{BUDGET_LABELS[place.budget]}</span>
              <span className="text-slate-200">|</span>
              <span>{place.indoor && place.outdoor ? 'Indoor/Outdoor' : place.indoor ? 'Indoor' : 'Outdoor'}</span>
              <span className="text-slate-200">|</span>
              <span>{place.avgTimeMinutes} min visit</span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-500 leading-relaxed mb-2">{place.description}</p>

            {/* Tip */}
            <div className="text-xs text-slate-400 italic bg-slate-50 rounded-xl px-3 py-2 mb-4">
              Tip: {place.insiderTip}
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              {stop.arrivalTime} - {stop.departureTime}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <a
                href={place.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs px-4 py-2.5"
              >
                Navigate
              </a>
              {onSwap && (
                <button
                  onClick={() => onSwap(place.id)}
                  className="text-xs px-4 py-2.5 border-2 border-slate-200 text-slate-500 rounded-xl font-semibold hover:border-slate-300 hover:text-primary transition-all"
                >
                  Swap
                </button>
              )}
            </div>
          </div>

          {/* Alternative suggestion */}
          {!isFirst && trafficAlert?.alternative && (severity === 'heavy' || severity === 'standstill') && (
            <div className="px-5 pb-4">
              <div className="flex items-start gap-2 text-xs bg-blue-50 border border-blue-100 rounded-xl p-3">
                <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-blue-500">?</span>
                <div>
                  <span className="font-semibold text-blue-700">Consider {trafficAlert.alternative.placeName}</span>
                  <span className="text-blue-500"> — {Math.round(trafficAlert.alternative.travelTime)} min away. {trafficAlert.alternative.reason}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
