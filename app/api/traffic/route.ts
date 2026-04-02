import { NextRequest, NextResponse } from 'next/server';
import {
  estimateTravelTime,
  getChennaiTrafficSummary,
} from '../../../lib/traffic-patterns';

let apiCallCount = 0;
let lastReset = new Date().toDateString();
const API_LIMIT = 2000;

function resetIfNewDay() {
  const today = new Date().toDateString();
  if (today !== lastReset) {
    apiCallCount = 0;
    lastReset = today;
  }
}

const routeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Traffic summary
  if (searchParams.get('summary') === 'true') {
    const summary = getChennaiTrafficSummary();
    return NextResponse.json(summary);
  }

  // Route traffic
  const fromLat = parseFloat(searchParams.get('fromLat') || '0');
  const fromLng = parseFloat(searchParams.get('fromLng') || '0');
  const toLat = parseFloat(searchParams.get('toLat') || '0');
  const toLng = parseFloat(searchParams.get('toLng') || '0');

  if (!fromLat || !toLat) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
  }

  const cacheKey = `${fromLat},${fromLng}-${toLat},${toLng}`;
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  resetIfNewDay();

  // Try TomTom API if key exists and under limit
  const tomtomKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
  if (tomtomKey && apiCallCount < API_LIMIT) {
    try {
      const url = `https://api.tomtom.com/routing/1/calculateRoute/${fromLat},${fromLng}:${toLat},${toLng}/json?traffic=true&key=${tomtomKey}`;
      const res = await fetch(url);
      if (res.ok) {
        apiCallCount++;
        const data = await res.json();
        const route = data.routes?.[0]?.summary;
        if (route) {
          const currentTime = route.travelTimeInSeconds / 60;
          const normalTime = route.noTrafficTravelTimeInSeconds / 60;
          const delayMinutes = currentTime - normalTime;

          let severity: string = 'clear';
          if (delayMinutes > 20) severity = 'heavy';
          else if (delayMinutes > 10) severity = 'moderate';
          else if (delayMinutes > 5) severity = 'light';

          const result = {
            currentTime: Math.round(currentTime),
            normalTime: Math.round(normalTime),
            delayMinutes: Math.round(delayMinutes),
            severity,
            incidents: [],
            isLive: true,
          };
          routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return NextResponse.json(result);
        }
      }
    } catch {
      // Fall through to estimation
    }
  }

  // Fallback: local estimation
  const est = estimateTravelTime(fromLat, fromLng, toLat, toLng);
  const result = {
    currentTime: Math.round(est.currentTime),
    normalTime: Math.round(est.normalTime),
    delayMinutes: Math.round(est.currentTime - est.normalTime),
    severity: est.severity,
    incidents: [],
    isLive: false,
  };
  routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return NextResponse.json(result);
}
