import { NextRequest, NextResponse } from 'next/server';
import { PLACES } from '../../../lib/places-data';
import { scoreAllPlaces } from '../../../lib/scoring';
import { estimateTravelTime } from '../../../lib/traffic-patterns';
import { UserPrefs, Itinerary, ItineraryStop, AREA_COORDINATES } from '../../../types';

// In-memory store for plans (use Vercel KV in production)
const planStore = new Map<string, Itinerary>();

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function getMaxStops(duration: number): number {
  if (duration <= 120) return 2;
  if (duration <= 240) return 3;
  if (duration <= 360) return 4;
  return 5;
}

function getTimeString(base: string, addMin: number): string {
  const [h, m] = base.split(':').map(Number);
  const total = h * 60 + m + addMin;
  return `${Math.floor(total / 60) % 24}`.padStart(2, '0') + ':' + `${total % 60}`.padStart(2, '0');
}

function getDefaultTime(slot: string): string {
  if (slot === 'morning') return '08:00';
  if (slot === 'afternoon') return '13:00';
  if (slot === 'evening') return '17:00';
  return '10:00';
}

export async function POST(request: NextRequest) {
  try {
    const prefs: UserPrefs = await request.json();
    const scored = scoreAllPlaces(PLACES, prefs);
    const maxStops = getMaxStops(prefs.duration);

    // Select with category diversity
    const selected: typeof scored = [];
    const catCount: Record<string, number> = {};
    for (const s of scored) {
      if (selected.length >= maxStops) break;
      const c = catCount[s.place.category] || 0;
      if (c < 2) {
        selected.push(s);
        catCount[s.place.category] = c + 1;
      }
    }

    const startCoords = AREA_COORDINATES[prefs.startArea] || { lat: 13.0418, lng: 80.2341 };
    const places = selected.map(s => s.place);

    // Simple nearest-neighbor ordering
    const ordered: typeof places = [];
    const remaining = [...places];
    let curLat = startCoords.lat;
    let curLng = startCoords.lng;

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestTime = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const est = estimateTravelTime(curLat, curLng, remaining[i].lat, remaining[i].lng);
        if (est.currentTime < bestTime) {
          bestTime = est.currentTime;
          bestIdx = i;
        }
      }
      const next = remaining.splice(bestIdx, 1)[0];
      ordered.push(next);
      curLat = next.lat;
      curLng = next.lng;
    }

    // Build stops
    const departureTime = prefs.departureTime || getDefaultTime(prefs.timeSlot);
    let currentTime = departureTime;
    let totalTravel = 0;
    let totalOverhead = 0;
    const stops: ItineraryStop[] = [];

    for (let i = 0; i < ordered.length; i++) {
      const place = ordered[i];
      const fLat = i === 0 ? startCoords.lat : ordered[i - 1].lat;
      const fLng = i === 0 ? startCoords.lng : ordered[i - 1].lng;
      const est = estimateTravelTime(fLat, fLng, place.lat, place.lng);

      totalTravel += est.currentTime;
      totalOverhead += est.currentTime - est.normalTime;

      const arrival = getTimeString(currentTime, Math.round(est.currentTime));
      const depart = getTimeString(arrival, place.avgTimeMinutes);

      stops.push({
        place,
        order: i + 1,
        arrivalTime: arrival,
        departureTime: depart,
        travelFromPrevious: Math.round(est.currentTime),
        trafficAlert: {
          from: i === 0 ? prefs.startArea : ordered[i - 1].name,
          to: place.name,
          currentTravelTime: Math.round(est.currentTime),
          normalTravelTime: Math.round(est.normalTime),
          delayMinutes: Math.round(est.currentTime - est.normalTime),
          severity: est.severity,
          incidents: [],
          isLive: false,
        },
      });

      currentTime = depart;
    }

    const id = generateId();
    const itinerary: Itinerary = {
      id,
      stops,
      preferences: prefs,
      totalDuration: Math.round(ordered.reduce((s, p) => s + p.avgTimeMinutes, 0) + totalTravel),
      totalTravelTime: Math.round(totalTravel),
      totalTrafficOverhead: Math.round(totalOverhead),
      totalCost: {
        min: ordered.filter(p => p.budget !== 'free').length * 100,
        max: ordered.filter(p => p.budget !== 'free').length * 500,
      },
      createdAt: new Date().toISOString(),
    };

    planStore.set(id, itinerary);

    return NextResponse.json(itinerary);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to generate' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const plan = planStore.get(id);
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  return NextResponse.json(plan);
}
