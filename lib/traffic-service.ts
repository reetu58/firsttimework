import { TrafficAlert, TrafficSeverity, TrafficIncident, TrafficSummary, Place } from '../types';
import { estimateTravelTime, getChennaiTrafficSummary } from './traffic-patterns';

// Cache traffic data for 5 minutes
const trafficCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

function getCached(key: string) {
  const cached = trafficCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
  return null;
}

function setCache(key: string, data: any) {
  trafficCache.set(key, { data, timestamp: Date.now() });
}

export async function getRouteTraffic(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<{ currentTime: number; normalTime: number; delayMinutes: number; severity: TrafficSeverity; incidents: TrafficIncident[]; isLive: boolean }> {
  const cacheKey = `route:${fromLat},${fromLng}-${toLat},${toLng}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`/api/traffic?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`);
    if (res.ok) {
      const data = await res.json();
      setCache(cacheKey, data);
      return data;
    }
    throw new Error('API failed');
  } catch {
    // Fallback to local estimation
    const est = estimateTravelTime(fromLat, fromLng, toLat, toLng);
    const result = {
      currentTime: est.currentTime,
      normalTime: est.normalTime,
      delayMinutes: est.currentTime - est.normalTime,
      severity: est.severity,
      incidents: [] as TrafficIncident[],
      isLive: false,
    };
    setCache(cacheKey, result);
    return result;
  }
}

export async function getTrafficAlertForLeg(
  fromPlace: { name: string; lat: number; lng: number },
  toPlace: Place,
  allPlaces: Place[]
): Promise<TrafficAlert> {
  const traffic = await getRouteTraffic(fromPlace.lat, fromPlace.lng, toPlace.lat, toPlace.lng);

  const alert: TrafficAlert = {
    from: fromPlace.name,
    to: toPlace.name,
    currentTravelTime: traffic.currentTime,
    normalTravelTime: traffic.normalTime,
    delayMinutes: traffic.delayMinutes,
    severity: traffic.severity,
    incidents: traffic.incidents,
    isLive: traffic.isLive,
  };

  // If heavy traffic, find alternative
  if (traffic.severity === 'heavy' || traffic.severity === 'standstill') {
    const sameCategoryPlaces = allPlaces.filter(
      p => p.category === toPlace.category && p.id !== toPlace.id
    );

    let bestAlt = null;
    let bestTime = Infinity;

    for (const alt of sameCategoryPlaces) {
      const altTraffic = await getRouteTraffic(fromPlace.lat, fromPlace.lng, alt.lat, alt.lng);
      if (altTraffic.currentTime < bestTime && altTraffic.severity !== 'heavy' && altTraffic.severity !== 'standstill') {
        bestTime = altTraffic.currentTime;
        bestAlt = { place: alt, traffic: altTraffic };
      }
    }

    if (bestAlt) {
      alert.alternative = {
        placeName: bestAlt.place.name,
        placeId: bestAlt.place.id,
        travelTime: bestAlt.traffic.currentTime,
        reason: `Similar vibe, only ${Math.round(bestAlt.traffic.currentTime)} min away with ${bestAlt.traffic.severity} traffic`,
      };
    }

    // Suggest best departure window
    const hour = new Date().getHours();
    if (hour >= 15 && hour <= 18) {
      alert.bestDepartureWindow = `Traffic typically clears after ${hour >= 17 ? '8:00' : '6:30'} PM`;
    }
  }

  return alert;
}

export async function getTrafficSummary(): Promise<TrafficSummary> {
  const cached = getCached('summary');
  if (cached) return cached;

  try {
    const res = await fetch('/api/traffic?summary=true');
    if (res.ok) {
      const data = await res.json();
      setCache('summary', data);
      return data;
    }
    throw new Error('API failed');
  } catch {
    const summary = getChennaiTrafficSummary();
    setCache('summary', summary);
    return summary;
  }
}

export function getSeverityColor(severity: TrafficSeverity): string {
  switch (severity) {
    case 'clear': return '#2D6A4F';
    case 'light': return '#EF9F27';
    case 'moderate': return '#FB8500';
    case 'heavy': return '#E24B4A';
    case 'standstill': return '#E24B4A';
  }
}

export function getSeverityEmoji(severity: TrafficSeverity): string {
  switch (severity) {
    case 'clear': return '🟢';
    case 'light': return '🟡';
    case 'moderate': return '🟠';
    case 'heavy': return '🔴';
    case 'standstill': return '⛔';
  }
}

export function getSeverityLabel(severity: TrafficSeverity): string {
  switch (severity) {
    case 'clear': return 'Smooth ride';
    case 'light': return 'Slightly slow';
    case 'moderate': return 'Moderate traffic';
    case 'heavy': return 'Heavy traffic';
    case 'standstill': return 'Standstill';
  }
}
