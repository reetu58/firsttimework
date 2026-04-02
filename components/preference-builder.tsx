'use client';
import { useState } from 'react';
import {
  UserPrefs, PlaceCategory, Vibe, GroupType, BudgetRange,
  DayChoice, TimeSlot, Duration, AREAS, CATEGORY_LABELS,
} from '../types';

interface Props {
  onGenerate: (prefs: UserPrefs) => void;
  isGenerating?: boolean;
}

function Chip({ label, selected, onClick, variant = 'single' }: {
  label: string; selected: boolean; onClick: () => void; variant?: 'single' | 'multi';
}) {
  const base = selected
    ? variant === 'multi' ? 'chip chip-selected-accent' : 'chip chip-selected'
    : 'chip';
  return <button type="button" className={base} onClick={onClick}>{label}</button>;
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-primary">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

const VIBE_LABELS: Record<Vibe, string> = {
  chill: 'Chill', adventure: 'Adventure', romantic: 'Romantic',
  cultural: 'Cultural', social: 'Social', artsy: 'Artsy',
  family: 'Family', foodie: 'Foodie', nature: 'Nature',
};

const GROUP_LABELS: Record<GroupType, string> = {
  solo: 'Solo', couple: 'Couple', friends: 'Friends',
  family: 'Family', 'large-group': 'Large Group',
};

const BUDGET_LABELS: Record<BudgetRange, string> = {
  free: 'Free only', 'under-500': 'Under ₹500', 'under-2000': 'Under ₹2,000', 'no-limit': 'No limit',
};

const DAY_LABELS: Record<DayChoice, string> = {
  saturday: 'Saturday', sunday: 'Sunday', both: 'Both days',
};

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', flexible: 'Flexible',
};

const DURATION_LABELS: Record<string, string> = {
  '120': '2 hours', '240': '4 hours', '360': '6 hours', '480': 'Full Day',
};

export default function PreferenceBuilder({ onGenerate, isGenerating }: Props) {
  const [day, setDay] = useState<DayChoice>('saturday');
  const [duration, setDuration] = useState<Duration>(240);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('flexible');
  const [departureTime, setDepartureTime] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('friends');
  const [budget, setBudget] = useState<BudgetRange>('under-500');
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [categories, setCategories] = useState<PlaceCategory[]>([]);
  const [startArea, setStartArea] = useState<string>(AREAS[0]);

  const toggleVibe = (v: Vibe) =>
    setVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleCategory = (c: PlaceCategory) =>
    setCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const handleGenerate = () => {
    onGenerate({ day, duration, timeSlot, departureTime, groupType, budget, vibes, categories, startArea });
  };

  const selections = [day !== 'saturday', duration !== 240, timeSlot !== 'flexible', groupType !== 'friends', budget !== 'under-500', vibes.length > 0, categories.length > 0, startArea !== AREAS[0]];
  const filledCount = selections.filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Personalization</span>
          <span className="text-xs font-bold text-primary">{filledCount}/8</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(12, (filledCount / 8) * 100)}%` }}
          />
        </div>
      </div>

      <div className="card-premium p-6 md:p-8 mb-6">
        <Section title="When are you going?" subtitle="Pick day and duration">
          {(Object.keys(DAY_LABELS) as DayChoice[]).map(d => (
            <Chip key={d} label={DAY_LABELS[d]} selected={day === d} onClick={() => setDay(d)} />
          ))}
          <div className="w-full h-2" />
          {(Object.keys(DURATION_LABELS) as string[]).map(d => (
            <Chip key={d} label={DURATION_LABELS[d]} selected={duration === Number(d)} onClick={() => setDuration(Number(d) as Duration)} />
          ))}
        </Section>

        <Section title="Preferred time" subtitle="When do you want to head out?">
          {(Object.keys(SLOT_LABELS) as TimeSlot[]).map(s => (
            <Chip key={s} label={SLOT_LABELS[s]} selected={timeSlot === s} onClick={() => setTimeSlot(s)} />
          ))}
        </Section>

        <div className="mb-8">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-primary">Departure time</h3>
            <p className="text-xs text-slate-400 mt-0.5">Optional — triggers live traffic check</p>
          </div>
          <input
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className="w-full max-w-[200px]"
          />
        </div>

        <Section title="Who's coming?">
          {(Object.keys(GROUP_LABELS) as GroupType[]).map(g => (
            <Chip key={g} label={GROUP_LABELS[g]} selected={groupType === g} onClick={() => setGroupType(g)} />
          ))}
        </Section>

        <Section title="Budget">
          {(Object.keys(BUDGET_LABELS) as BudgetRange[]).map(b => (
            <Chip key={b} label={BUDGET_LABELS[b]} selected={budget === b} onClick={() => setBudget(b)} />
          ))}
        </Section>
      </div>

      <div className="card-premium p-6 md:p-8 mb-6">
        <Section title="What's your mood?" subtitle="Pick as many as you like">
          {(Object.keys(VIBE_LABELS) as Vibe[]).map(v => (
            <Chip key={v} label={VIBE_LABELS[v]} selected={vibes.includes(v)} onClick={() => toggleVibe(v)} variant="multi" />
          ))}
        </Section>

        <Section title="Categories" subtitle="What kind of places?">
          {(Object.keys(CATEGORY_LABELS) as PlaceCategory[]).map(c => (
            <Chip key={c} label={CATEGORY_LABELS[c]} selected={categories.includes(c)} onClick={() => toggleCategory(c)} variant="multi" />
          ))}
        </Section>
      </div>

      <div className="card-premium p-6 md:p-8 mb-8">
        <Section title="Starting area" subtitle="Where are you coming from?">
          {AREAS.map(a => (
            <Chip key={a} label={a} selected={startArea === a} onClick={() => setStartArea(a)} />
          ))}
        </Section>
      </div>

      {vibes.length === 0 && categories.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-3 mb-4 border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Pick at least one mood or category for best results
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Generating your plan...
          </span>
        ) : (
          'Generate My Plan'
        )}
      </button>
    </div>
  );
}
