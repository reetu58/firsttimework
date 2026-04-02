import { Place, UserPrefs, Itinerary, ItineraryStop, TrafficAlert, AREA_COORDINATES } from '../types';
import { PLACES } from './places-data';
import { scoreAllPlaces } from './scoring';
import { estimateTravelTime } from './traffic-patterns';
import { getWeather, shouldForceIndoor } from './weather-service';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function getMaxStops(durationMinutes: number): number {
  if (durationMinutes <= 120) return 2;
  if (durationMinutes <= 240) return 3;
  if (durationMinutes <= 360) return 4;
  return 5;
}

function getTimeString(baseTime: string, addMinutes: number): string {
  const [h, m] = baseTime.split(':').map(Number);
  const totalMin = h * 60 + m + addMinutes;
  const hours = Math.floor(totalMin / 60) % 24;
  const mins = totalMin % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function getDefaultDepartureTime(timeSlot: string): string {
  switch (timeSlot) {
    case 'morning': return '08:00';
    case 'afternoon': return '13:00';
    case 'evening': return '17:00';
    default: return '10:00';
  }
}

function getBudgetEstimate(budget: string): { min: number; max: number } {
  switch (budget) {
    case 'free': return { min: 0, max: 0 };
    case 'under-500': return { min: 100, max: 500 };
    case 'under-2000': return { min: 200, max: 2000 };
    default: return { min: 0, max: 5000 };
  }
}

// Nearest-neighbor with traffic-weighted distance
function optimizeStopOrder(
  places: Place[],
  startLat: number,
  startLng: number
): Place[] {
  if (places.length <= 1) return places;

  const ordered: Place[] = [];
  const remaining = [...places];
  let currentLat = startLat;
  let currentLng = startLng;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestCost = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const p = remaining[i];
      const est = estimateTravelTime(currentLat, currentLng, p.lat, p.lng);
      // Use current (traffic-adjusted) time as cost
      const cost = est.currentTime;
      if (cost < bestCost) {
        bestCost = cost;
        bestIdx = i;
      }
    }

    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    currentLat = next.lat;
    currentLng = next.lng;
  }

  return ordered;
}

export async function generateItinerary(prefs: UserPrefs): Promise<Itinerary> {
  // 1. Score all places
  const scored = scoreAllPlaces(PLACES, prefs);

  // 2. Check weather for indoor/outdoor preference
  let weather;
  try {
    weather = await getWeather();
  } catch {
    weather = null;
  }

  let filteredScored = scored;
  if (weather && shouldForceIndoor(weather, prefs.timeSlot)) {
    const indoorPlaces = scored.filter(s => s.place.indoor);
    if (indoorPlaces.length >= 2) {
      filteredScored = indoorPlaces;
    }
  }

  // 3. Select top places based on duration
  const maxStops = getMaxStops(prefs.duration);

  // Ensure category diversity - pick at most 2 from same category
  const selected: Place[] = [];
  const categoryCount: Record<string, number> = {};

  for (const { place } of filteredScored) {
    if (selected.length >= maxStops) break;
    const count = categoryCount[place.category] || 0;
    if (count < 2) {
      selected.push(place);
      categoryCount[place.category] = count + 1;
    }
  }

  // 4. Optimize stop order
  const startCoords = AREA_COORDINATES[prefs.startArea] || { lat: 13.0418, lng: 80.2341 };
  const ordered = optimizeStopOrder(selected, startCoords.lat, startCoords.lng);

  // 5. Build itinerary stops with timing
  const departureTime = prefs.departureTime || getDefaultDepartureTime(prefs.timeSlot);
  let currentTime = departureTime;
  let totalTravelTime = 0;
  let totalTrafficOverhead = 0;
  const stops: ItineraryStop[] = [];

  for (let i = 0; i < ordered.length; i++) {
    const place = ordered[i];

    // Calculate travel time from previous location
    const fromLat = i === 0 ? startCoords.lat : ordered[i - 1].lat;
    const fromLng = i === 0 ? startCoords.lng : ordered[i - 1].lng;

    const est = estimateTravelTime(fromLat, fromLng, place.lat, place.lng);
    const travelTime = est.currentTime;
    totalTrafficOverhead += est.currentTime - est.normalTime;

    const trafficAlert: TrafficAlert = {
      from: i === 0 ? prefs.startArea : ordered[i - 1].name,
      to: place.name,
      currentTravelTime: est.currentTime,
      normalTravelTime: est.normalTime,
      delayMinutes: est.currentTime - est.normalTime,
      severity: est.severity,
      incidents: [],
      isLive: false,
    };

    totalTravelTime += travelTime;

    const arrivalTime = getTimeString(currentTime, Math.round(travelTime));
    const departTime = getTimeString(arrivalTime, place.avgTimeMinutes);

    stops.push({
      place,
      order: i + 1,
      arrivalTime,
      departureTime: departTime,
      travelFromPrevious: Math.round(travelTime),
      trafficAlert,
    });

    currentTime = departTime;
  }

  // 6. Calculate total cost
  const budgetEst = getBudgetEstimate(prefs.budget);
  const totalCost = {
    min: ordered.reduce((sum, p) => sum + (p.budget === 'free' ? 0 : budgetEst.min), 0),
    max: ordered.reduce((sum, p) => sum + (p.budget === 'free' ? 0 : budgetEst.max), 0),
  };

  const totalDuration = ordered.reduce((sum, p) => sum + p.avgTimeMinutes, 0) + totalTravelTime;

  return {
    id: generateId(),
    stops,
    preferences: prefs,
    totalDuration: Math.round(totalDuration),
    totalTravelTime: Math.round(totalTravelTime),
    totalTrafficOverhead: Math.round(totalTrafficOverhead),
    totalCost,
    createdAt: new Date().toISOString(),
  };
}

export function encodeItinerary(itinerary: Itinerary): string {
  try {
    return btoa(JSON.stringify(itinerary));
  } catch {
    return JSON.stringify(itinerary);
  }
}

export function decodeItinerary(encoded: string): Itinerary | null {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    try {
      return JSON.parse(encoded);
    } catch {
      return null;
    }
  }
}
