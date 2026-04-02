import type { TrafficSeverity, TrafficSummary } from '../types';

// ---------------------------------------------------------------------------
// Static traffic multipliers for Chennai corridors
// Used as a fallback when the TomTom API quota is exhausted.
// ---------------------------------------------------------------------------

export const CHENNAI_TRAFFIC_PATTERNS: Record<string, Record<string, Record<string, number>>> = {
  saturday: {
    morning: {
      "OMR": 1.1,
      "ECR": 1.2,
      "Anna Salai": 1.3,
      "T. Nagar": 1.4,
      "Mount Road": 1.3,
      "Poonamallee High Road": 1.2,
      "GST Road": 1.3,
      "Inner Ring Road": 1.2,
      "Outer Ring Road": 1.1,
    },
    afternoon: {
      "OMR": 1.5,
      "ECR": 1.8,
      "Anna Salai": 1.6,
      "T. Nagar": 2.0,
      "Mount Road": 1.5,
      "Poonamallee High Road": 1.4,
      "GST Road": 1.5,
      "Inner Ring Road": 1.5,
      "Outer Ring Road": 1.3,
    },
    evening: {
      "OMR": 2.2,
      "ECR": 2.5,
      "Anna Salai": 1.8,
      "T. Nagar": 2.3,
      "Besant Nagar": 2.0,
      "Mount Road": 1.9,
      "Poonamallee High Road": 1.6,
      "GST Road": 1.7,
      "Inner Ring Road": 1.8,
      "Outer Ring Road": 1.5,
    },
  },
  sunday: {
    morning: {
      "OMR": 1.0,
      "ECR": 1.1,
      "Anna Salai": 1.0,
      "T. Nagar": 1.1,
      "Mount Road": 1.0,
      "Poonamallee High Road": 1.0,
      "GST Road": 1.0,
      "Inner Ring Road": 1.0,
      "Outer Ring Road": 1.0,
    },
    afternoon: {
      "OMR": 1.3,
      "ECR": 1.5,
      "Anna Salai": 1.2,
      "T. Nagar": 1.5,
      "Mount Road": 1.2,
      "Poonamallee High Road": 1.1,
      "GST Road": 1.2,
      "Inner Ring Road": 1.2,
      "Outer Ring Road": 1.1,
    },
    evening: {
      "OMR": 1.8,
      "ECR": 2.2,
      "Anna Salai": 1.5,
      "T. Nagar": 1.8,
      "Mount Road": 1.5,
      "Poonamallee High Road": 1.3,
      "GST Road": 1.5,
      "Inner Ring Road": 1.5,
      "Outer Ring Road": 1.3,
    },
  },
};

// ---------------------------------------------------------------------------
// Known congestion hotspots
// ---------------------------------------------------------------------------

export interface Bottleneck {
  name: string;
  lat: number;
  lng: number;
  peakDelay: number; // minutes
  peakHours: number[];
}

export const CHENNAI_BOTTLENECKS: Bottleneck[] = [
  { name: "Adyar Signal",              lat: 13.00, lng: 80.26, peakDelay: 15, peakHours: [17, 18, 19] },
  { name: "Tidel Park Junction",       lat: 12.99, lng: 80.25, peakDelay: 20, peakHours: [17, 18, 19, 20] },
  { name: "Kathipara Junction",        lat: 13.01, lng: 80.21, peakDelay: 25, peakHours: [16, 17, 18, 19, 20] },
  { name: "Gemini Flyover",            lat: 13.06, lng: 80.25, peakDelay: 10, peakHours: [18, 19] },
  { name: "Tambaram Junction",         lat: 12.93, lng: 80.12, peakDelay: 20, peakHours: [17, 18, 19] },
  { name: "Guindy Signal",             lat: 13.01, lng: 80.22, peakDelay: 15, peakHours: [17, 18, 19, 20] },
  { name: "Velachery Main Road",       lat: 12.98, lng: 80.22, peakDelay: 12, peakHours: [10, 11, 17, 18, 19] },
  { name: "ECR Toll Gate",             lat: 12.93, lng: 80.25, peakDelay: 15, peakHours: [16, 17, 18, 19, 20] },
  { name: "Chrompet Railway Crossing", lat: 12.95, lng: 80.14, peakDelay: 10, peakHours: [9, 10, 17, 18] },
  { name: "Porur Junction",            lat: 13.04, lng: 80.16, peakDelay: 18, peakHours: [16, 17, 18, 19] },
];

// ---------------------------------------------------------------------------
// Corridor centre-points used by getNearestCorridor
// ---------------------------------------------------------------------------

const CORRIDOR_CENTRES: { name: string; lat: number; lng: number }[] = [
  { name: "OMR",                    lat: 12.9516, lng: 80.2412 },
  { name: "ECR",                    lat: 12.9300, lng: 80.2500 },
  { name: "Anna Salai",             lat: 13.0500, lng: 80.2500 },
  { name: "T. Nagar",               lat: 13.0418, lng: 80.2341 },
  { name: "Besant Nagar",           lat: 13.0002, lng: 80.2668 },
  { name: "Mount Road",             lat: 13.0600, lng: 80.2600 },
  { name: "Poonamallee High Road",  lat: 13.0500, lng: 80.1800 },
  { name: "GST Road",               lat: 12.9600, lng: 80.1400 },
  { name: "Inner Ring Road",        lat: 13.0200, lng: 80.2100 },
  { name: "Outer Ring Road",        lat: 13.0000, lng: 80.1600 },
];

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Returns the straight-line distance between two coordinates in kilometres
 * using the haversine formula.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Classifies an hour of the day into a broad traffic time-slot.
 *  - morning   : 06:00 – 11:59
 *  - afternoon : 12:00 – 16:59
 *  - evening   : 17:00 – 22:59
 */
export function getTimeSlot(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Returns the day-type key used in CHENNAI_TRAFFIC_PATTERNS.
 * Weekdays are treated as Saturday (moderate traffic baseline).
 */
export function getDayType(date?: Date): 'saturday' | 'sunday' {
  const d = date ?? new Date();
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0) return 'sunday';
  return 'saturday'; // Saturday and all weekdays default to saturday patterns
}

/**
 * Returns the traffic multiplier for a given corridor at the current (or
 * provided) date/time.  Falls back to 1.3 if the corridor is not found.
 */
export function getTrafficMultiplier(corridor: string, date?: Date): number {
  const d = date ?? new Date();
  const dayType = getDayType(d);
  const timeSlot = getTimeSlot(d.getHours());

  return CHENNAI_TRAFFIC_PATTERNS[dayType]?.[timeSlot]?.[corridor] ?? 1.3;
}

/**
 * Sums the peak delays of every bottleneck that is within `radiusKm` of the
 * given coordinates AND is currently in a peak hour.
 *
 * @param lat       Latitude of the route point to check
 * @param lng       Longitude of the route point to check
 * @param hour      Current hour (0-23)
 * @param radiusKm  Search radius in kilometres (default 2 km)
 * @returns         Total additional delay in minutes
 */
export function getBottleneckDelay(
  lat: number,
  lng: number,
  hour: number,
  radiusKm = 2,
): number {
  let totalDelay = 0;

  for (const bottleneck of CHENNAI_BOTTLENECKS) {
    const dist = haversineDistance(lat, lng, bottleneck.lat, bottleneck.lng);
    if (dist <= radiusKm && bottleneck.peakHours.includes(hour)) {
      totalDelay += bottleneck.peakDelay;
    }
  }

  return totalDelay;
}

/**
 * Maps a numeric traffic multiplier to a human-readable severity label.
 *
 *  < 1.2  → clear
 *  < 1.5  → light
 *  < 1.8  → moderate
 *  < 2.2  → heavy
 *  ≥ 2.2  → standstill
 */
export function estimateTrafficSeverity(multiplier: number): TrafficSeverity {
  if (multiplier < 1.2) return 'clear';
  if (multiplier < 1.5) return 'light';
  if (multiplier < 1.8) return 'moderate';
  if (multiplier < 2.2) return 'heavy';
  return 'standstill';
}

/**
 * Returns the name of the nearest corridor centre-point to the given
 * coordinates.
 */
export function getNearestCorridor(lat: number, lng: number): string {
  let nearestName = CORRIDOR_CENTRES[0].name;
  let minDist = Infinity;

  for (const corridor of CORRIDOR_CENTRES) {
    const dist = haversineDistance(lat, lng, corridor.lat, corridor.lng);
    if (dist < minDist) {
      minDist = dist;
      nearestName = corridor.name;
    }
  }

  return nearestName;
}

/**
 * Estimates travel time between two coordinates using a straight-line
 * distance adjusted by a road-factor of 1.4 and a base urban speed of
 * 30 km/h, then scaled by the local traffic pattern multiplier.
 *
 * This is a fully offline estimate — `isLive` is always `false`.
 */
export function estimateTravelTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  date?: Date,
): {
  currentTime: number;
  normalTime: number;
  severity: TrafficSeverity;
  isLive: false;
} {
  const BASE_SPEED_KMH = 30;
  const ROAD_FACTOR = 1.4;

  const straightLineKm = haversineDistance(fromLat, fromLng, toLat, toLng);
  const roadKm = straightLineKm * ROAD_FACTOR;

  // Normal travel time with no congestion (minutes)
  const normalTime = (roadKm / BASE_SPEED_KMH) * 60;

  // Pick the corridor nearest the midpoint for the multiplier lookup
  const midLat = (fromLat + toLat) / 2;
  const midLng = (fromLng + toLng) / 2;
  const corridor = getNearestCorridor(midLat, midLng);
  const multiplier = getTrafficMultiplier(corridor, date);

  const currentTime = normalTime * multiplier;
  const severity = estimateTrafficSeverity(multiplier);

  return { currentTime, normalTime, severity, isLive: false };
}

/**
 * Builds a high-level traffic summary across every known corridor for the
 * given date/time.
 */
export function getChennaiTrafficSummary(date?: Date): TrafficSummary {
  const d = date ?? new Date();
  const dayType = getDayType(d);
  const timeSlot = getTimeSlot(d.getHours());

  const patternSlot = CHENNAI_TRAFFIC_PATTERNS[dayType]?.[timeSlot] ?? {};

  const corridors = Object.entries(patternSlot).map(([name, multiplier]) => ({
    name,
    severity: estimateTrafficSeverity(multiplier),
    // avg delay expressed as extra minutes per 10 km driven at base speed
    avgDelay: Math.round(((multiplier - 1) * 10) / 30 * 60),
  }));

  // Overall severity is determined by the highest single-corridor multiplier
  const maxMultiplier = Object.values(patternSlot).reduce(
    (max, val) => Math.max(max, val),
    1.0,
  );
  const overall = estimateTrafficSeverity(maxMultiplier);

  return { overall, corridors, isLive: false };
}
