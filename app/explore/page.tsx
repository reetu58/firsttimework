'use client';
import { useState, useMemo } from 'react';
import { PLACES } from '../../lib/places-data';
import { PlaceCategory, CATEGORY_LABELS, CATEGORY_ICONS, Place } from '../../types';

const ALL_CATEGORIES: ('all' | PlaceCategory)[] = [
  'all', 'beaches', 'cafes', 'parks', 'sports-fun', 'temples-heritage',
  'shopping', 'art-museums', 'street-food', 'photography',
];

const BUDGET_LABELS: Record<string, string> = {
  free: 'Free', 'under-500': 'Under ₹500', 'under-2000': 'Under ₹2K', 'no-limit': '₹₹₹',
};

function isOpenNow(place: Place): boolean {
  const now = new Date();
  const day = now.getDay() === 0 ? 'sunday' : 'saturday';
  const hours = place.openHours[day];
  if (!hours) return false;
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = hours.open.split(':').map(Number);
  const [ch, cm] = hours.close.split(':').map(Number);
  return currentMin >= oh * 60 + om && currentMin < ch * 60 + cm;
}

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PlaceCategory>('all');
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterFree, setFilterFree] = useState(false);
  const [filterIndoor, setFilterIndoor] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'name'>('rating');

  const filtered = useMemo(() => {
    let list = [...PLACES];
    if (selectedCategory !== 'all') list = list.filter(p => p.category === selectedCategory);
    if (filterOpenNow) list = list.filter(isOpenNow);
    if (filterFree) list = list.filter(p => p.budget === 'free');
    if (filterIndoor) list = list.filter(p => p.indoor);
    if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [selectedCategory, filterOpenNow, filterFree, filterIndoor, sortBy]);

  return (
    <div className="min-h-screen bg-sand -mt-16">
      {/* Header */}
      <div className="hero-gradient text-white pt-28 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <p className="section-label text-amber-400/80 mb-2">Discover</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 animate-fade-in">Explore Chennai</h1>
          <p className="text-white/40 text-sm max-w-md mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
            Browse curated spots — find your next weekend destination
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-6 relative z-10">
        {/* Filters Card */}
        <div className="card-premium p-5 mb-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
            {ALL_CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`chip whitespace-nowrap ${
                  selectedCategory === c ? 'chip-selected' : ''
                }`}
              >
                {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors">
              <input type="checkbox" checked={filterOpenNow} onChange={() => setFilterOpenNow(!filterOpenNow)} />
              Open now
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors">
              <input type="checkbox" checked={filterFree} onChange={() => setFilterFree(!filterFree)} />
              Free entry
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors">
              <input type="checkbox" checked={filterIndoor} onChange={() => setFilterIndoor(!filterIndoor)} />
              Indoor
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'name')}
              className="text-sm text-slate-600 ml-auto"
            >
              <option value="rating">Sort: Rating</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-slate-400 mb-4 font-medium">
          {filtered.length} {filtered.length === 1 ? 'place' : 'places'} found
        </p>

        {/* Place Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map(place => {
            const open = isOpenNow(place);
            return (
              <div
                key={place.id}
                className="card-premium p-5 group"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-primary text-base truncate group-hover:text-amber-600 transition-colors">
                      {place.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{place.area}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-xl flex-shrink-0 ml-3">
                    {CATEGORY_ICONS[place.category]}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-3">
                  <span className="font-semibold text-amber-500 flex items-center gap-1">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {place.rating}
                  </span>
                  <span className="text-slate-300">({place.reviewCount.toLocaleString()})</span>
                  <span className="text-slate-300">|</span>
                  <span>{BUDGET_LABELS[place.budget]}</span>
                  <span className="text-slate-300">|</span>
                  <span>{place.indoor ? 'Indoor' : 'Outdoor'}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                  {place.description}
                </p>

                {/* Bottom */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                    open ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                    {open ? 'Open now' : 'Closed'}
                  </span>
                  <a
                    href={place.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary hover:text-amber-600 transition-colors flex items-center gap-1"
                  >
                    Navigate
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 12 12">
                      <path d="M2 6h8M7 3l3 3-3 3" />
                    </svg>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl mx-auto mb-4">
              🤷
            </div>
            <p className="text-slate-500 text-sm">No places match your filters</p>
            <button
              onClick={() => { setSelectedCategory('all'); setFilterOpenNow(false); setFilterFree(false); setFilterIndoor(false); }}
              className="mt-3 text-sm font-semibold text-primary hover:text-amber-600 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <div className="h-16" />
    </div>
  );
}
