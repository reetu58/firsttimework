export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  area: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  budget: BudgetRange;
  avgTimeMinutes: number;
  indoor: boolean;
  outdoor: boolean;
  vibes: Vibe[];
  groupTypes: GroupType[];
  openHours: {
    saturday: { open: string; close: string } | null;
    sunday: { open: string; close: string } | null;
  };
  description: string;
  insiderTip: string;
  googleMapsUrl: string;
  imageKeyword: string;
}

export type PlaceCategory =
  | 'beaches'
  | 'cafes'
  | 'parks'
  | 'sports-fun'
  | 'temples-heritage'
  | 'shopping'
  | 'art-museums'
  | 'street-food'
  | 'photography';

export type Vibe =
  | 'chill'
  | 'adventure'
  | 'romantic'
  | 'cultural'
  | 'social'
  | 'artsy'
  | 'family'
  | 'foodie'
  | 'nature';

export type GroupType = 'solo' | 'couple' | 'friends' | 'family' | 'large-group';

export type BudgetRange = 'free' | 'under-500' | 'under-2000' | 'no-limit';

export type DayChoice = 'saturday' | 'sunday' | 'both';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'flexible';
export type Duration = 120 | 240 | 360 | 480;

export interface UserPrefs {
  day: DayChoice;
  duration: Duration;
  timeSlot: TimeSlot;
  departureTime: string;
  groupType: GroupType;
  budget: BudgetRange;
  vibes: Vibe[];
  categories: PlaceCategory[];
  startArea: string;
}

export type TrafficSeverity = 'clear' | 'light' | 'moderate' | 'heavy' | 'standstill';

export interface TrafficIncident {
  type: string;
  description: string;
  severity: string;
  lat: number;
  lng: number;
}

export interface TrafficAlert {
  from: string;
  to: string;
  currentTravelTime: number;
  normalTravelTime: number;
  delayMinutes: number;
  severity: TrafficSeverity;
  incidents: TrafficIncident[];
  alternative?: {
    placeName: string;
    placeId: string;
    travelTime: number;
    reason: string;
  };
  bestDepartureWindow?: string;
  isLive: boolean;
}

export interface ItineraryStop {
  place: Place;
  order: number;
  arrivalTime: string;
  departureTime: string;
  travelFromPrevious: number;
  trafficAlert?: TrafficAlert;
}

export interface Itinerary {
  id: string;
  stops: ItineraryStop[];
  preferences: UserPrefs;
  totalDuration: number;
  totalTravelTime: number;
  totalTrafficOverhead: number;
  totalCost: { min: number; max: number };
  createdAt: string;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  rainChance: number;
  windSpeed: number;
  isLive: boolean;
}

export interface TrafficSummary {
  overall: TrafficSeverity;
  corridors: {
    name: string;
    severity: TrafficSeverity;
    avgDelay: number;
  }[];
  isLive: boolean;
}

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  beaches: '🏖️ Beaches',
  cafes: '☕ Cafes',
  parks: '🌳 Parks',
  'sports-fun': '🎯 Sports & Fun',
  'temples-heritage': '🛕 Temples & Heritage',
  shopping: '🛍️ Shopping',
  'art-museums': '🎨 Art & Museums',
  'street-food': '🍜 Street Food',
  photography: '📸 Photography Spots',
};

export const CATEGORY_ICONS: Record<PlaceCategory, string> = {
  beaches: '🏖️',
  cafes: '☕',
  parks: '🌳',
  'sports-fun': '🎯',
  'temples-heritage': '🛕',
  shopping: '🛍️',
  'art-museums': '🎨',
  'street-food': '🍜',
  photography: '📸',
};

export const AREAS = [
  'T. Nagar',
  'Anna Nagar',
  'Velachery',
  'Adyar',
  'Besant Nagar',
  'Mylapore',
  'OMR',
  'Tambaram',
  'Nungambakkam',
  'Egmore',
  'Thiruvanmiyur',
  'Guindy',
  'Porur',
  'Chromepet',
  'Sholinganallur',
] as const;

export const AREA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'T. Nagar': { lat: 13.0418, lng: 80.2341 },
  'Anna Nagar': { lat: 13.0850, lng: 80.2101 },
  'Velachery': { lat: 12.9815, lng: 80.2180 },
  'Adyar': { lat: 13.0063, lng: 80.2574 },
  'Besant Nagar': { lat: 13.0002, lng: 80.2668 },
  'Mylapore': { lat: 13.0368, lng: 80.2676 },
  'OMR': { lat: 12.9516, lng: 80.2412 },
  'Tambaram': { lat: 12.9249, lng: 80.1168 },
  'Nungambakkam': { lat: 13.0569, lng: 80.2425 },
  'Egmore': { lat: 13.0732, lng: 80.2609 },
  'Thiruvanmiyur': { lat: 12.9830, lng: 80.2594 },
  'Guindy': { lat: 13.0067, lng: 80.2206 },
  'Porur': { lat: 13.0382, lng: 80.1564 },
  'Chromepet': { lat: 12.9516, lng: 80.1443 },
  'Sholinganallur': { lat: 12.9010, lng: 80.2279 },
};
