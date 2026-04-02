'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Itinerary, CATEGORY_ICONS } from '../../../types';
import PlaceCard from '../../../components/place-card';
import TrafficSummaryBar from '../../../components/traffic-summary-bar';
import ShareButtons from '../../../components/share-buttons';
import dynamic from 'next/dynamic';

const TrafficMap = dynamic(() => import('../../../components/traffic-map'), { ssr: false });

export default function ItineraryPage() {
  const { id } = useParams();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/plan?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setItinerary(data);
          return;
        }
      } catch {}

      try {
        const decoded = JSON.parse(atob(id as string));
        if (decoded.stops) {
          setItinerary(decoded);
        } else {
          const res = await fetch('/api/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(decoded),
          });
          if (res.ok) {
            const data = await res.json();
            const iRes = await fetch(`/api/plan?id=${data.id}`);
            if (iRes.ok) setItinerary(await iRes.json());
          }
        }
      } catch {}
      setLoading(false);
    }
    load().finally(() => setLoading(false));
  }, [id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-primary font-semibold text-sm">Building your traffic-smart plan...</p>
          <p className="text-slate-400 text-xs mt-1">Checking routes and optimizing</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center card-premium p-10 max-w-sm mx-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-4">
            ?
          </div>
          <h2 className="text-lg font-bold text-primary mb-2">Plan not found</h2>
          <p className="text-sm text-slate-400 mb-6">This plan may have expired or the link is invalid.</p>
          <Link href="/plan" className="btn-primary inline-block text-sm px-6 py-3">
            Create New Plan
          </Link>
        </div>
      </div>
    );
  }

  const overallSeverity = itinerary.totalTrafficOverhead > 20 ? 'heavy'
    : itinerary.totalTrafficOverhead > 10 ? 'moderate'
    : itinerary.totalTrafficOverhead > 5 ? 'light' : 'clear';

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-sand">
      <TrafficSummaryBar
        stops={itinerary.stops.map(s => ({
          emoji: CATEGORY_ICONS[s.place.category],
          name: s.place.name.split(' ').slice(0, 2).join(' '),
        }))}
        totalDuration={itinerary.totalDuration}
        totalTravelTime={itinerary.totalTravelTime}
        totalTrafficOverhead={itinerary.totalTrafficOverhead}
        totalCost={itinerary.totalCost}
        overallSeverity={overallSeverity as any}
        onRefresh={handleRefresh}
        onShare={() => setShowShare(!showShare)}
        isRefreshing={isRefreshing}
      />

      {showShare && (
        <div className="max-w-5xl mx-auto px-4 pt-4 animate-fade-in">
          <ShareButtons
            title="My Chennai Weekend Plan | Weekendaa"
            text={`Just planned my weekend with Weekendaa — ${itinerary.stops.length} stops, traffic-optimized!`}
            url={shareUrl}
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-5 lg:gap-6">
          {/* Itinerary Timeline */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-primary">Your Weekend Plan</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(itinerary.createdAt).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                {itinerary.stops.length} stops
              </span>
            </div>

            <div className="space-y-0">
              {itinerary.stops.map((stop, i) => (
                <PlaceCard
                  key={stop.place.id}
                  stop={stop}
                  isFirst={i === 0}
                />
              ))}
            </div>

            <div className="flex gap-3 pt-6">
              <Link
                href="/plan"
                className="flex-1 text-center btn-secondary py-3.5 text-sm"
              >
                Regenerate
              </Link>
              <Link
                href="/plan"
                className="flex-1 text-center py-3.5 border-2 border-slate-200 text-slate-500 rounded-2xl font-semibold text-sm hover:border-primary hover:text-primary transition-all"
              >
                Edit Preferences
              </Link>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2 mt-6 lg:mt-0">
            <div className="lg:sticky lg:top-36">
              <button
                onClick={() => setShowMap(!showMap)}
                className="lg:hidden w-full mb-4 py-3 card-premium text-primary font-semibold text-sm text-center"
              >
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
              <div className={`${showMap ? 'block' : 'hidden'} lg:block`}>
                <TrafficMap
                  stops={itinerary.stops.map(s => ({
                    lat: s.place.lat,
                    lng: s.place.lng,
                    name: s.place.name,
                    order: s.order,
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
