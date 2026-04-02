import { Place, UserPrefs, BudgetRange } from '../types';
import { AREA_COORDINATES } from '../types';
import { haversineDistance } from './traffic-patterns';

const BUDGET_ORDER: BudgetRange[] = ['free', 'under-500', 'under-2000', 'no-limit'];

function budgetFits(placeBudget: BudgetRange, userBudget: BudgetRange): boolean {
  return BUDGET_ORDER.indexOf(placeBudget) <= BUDGET_ORDER.indexOf(userBudget);
}

export function scorePlace(place: Place, prefs: UserPrefs): number {
  let score = 0;

  // Category match (highest weight)
  if (prefs.categories.length === 0 || prefs.categories.includes(place.category)) {
    score += 30;
  } else {
    return 0; // If user selected categories and this isn't one, skip
  }

  // Budget fit
  if (budgetFits(place.budget, prefs.budget)) {
    score += 20;
  } else {
    return 0; // Over budget, skip
  }

  // Vibe match
  const vibeOverlap = place.vibes.filter(v => prefs.vibes.includes(v)).length;
  score += vibeOverlap * 10;

  // Group type match
  if (place.groupTypes.includes(prefs.groupType)) {
    score += 15;
  } else {
    score -= 20;
  }

  // Time slot & open hours check
  const day = prefs.day === 'both' ? 'saturday' : prefs.day;
  const hours = place.openHours[day];
  if (hours) {
    // Check if place is open during preferred time slot
    const openHour = parseInt(hours.open.split(':')[0]);
    const closeHour = parseInt(hours.close.split(':')[0]);

    if (prefs.timeSlot === 'morning' && openHour <= 9) score += 5;
    if (prefs.timeSlot === 'afternoon' && openHour <= 12 && closeHour >= 15) score += 5;
    if (prefs.timeSlot === 'evening' && closeHour >= 19) score += 5;
    if (prefs.timeSlot === 'flexible') score += 5;
  } else {
    return 0; // Closed on chosen day
  }

  // Distance from starting area (closer = better, but not too heavily weighted)
  const startCoords = AREA_COORDINATES[prefs.startArea];
  if (startCoords) {
    const dist = haversineDistance(startCoords.lat, startCoords.lng, place.lat, place.lng);
    if (dist < 5) score += 10;
    else if (dist < 10) score += 5;
    else if (dist < 15) score += 2;
    // Far places still get picked if score is high enough
  }

  // Rating bonus
  score += (place.rating - 3.5) * 5;

  return Math.max(0, score);
}

export function scoreAllPlaces(places: Place[], prefs: UserPrefs): { place: Place; score: number }[] {
  return places
    .map(place => ({ place, score: scorePlace(place, prefs) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
}
