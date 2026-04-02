'use client';
import Link from 'next/link';
import WeatherWidget from '../components/weather-widget';
import { useState, useEffect } from 'react';
import { TrafficSummary, TrafficSeverity } from '../types';

const TEMPLATES = [
  { title: 'Beach Day', icon: '🏖️', desc: 'Sun, sand & seafood along ECR', vibes: 'chill,nature', categories: 'beaches,street-food', color: 'from-cyan-50 to-blue-50', border: 'border-cyan-100' },
  { title: 'Cafe Hopping', icon: '☕', desc: 'Best brews across the city', vibes: 'chill,artsy', categories: 'cafes', color: 'from-amber-50 to-orange-50', border: 'border-amber-100' },
  { title: 'Heritage Walk', icon: '🛕', desc: 'Temples, history & culture', vibes: 'cultural', categories: 'temples-heritage,art-museums', color: 'from-violet-50 to-purple-50', border: 'border-violet-100' },
  { title: 'Adventure Day', icon: '🏄', desc: 'Thrills & excitement', vibes: 'adventure,social', categories: 'sports-fun', color: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
  { title: 'Foodie Trail', icon: '🍜', desc: 'Eat your way through Chennai', vibes: 'foodie', categories: 'street-food,cafes', color: 'from-red-50 to-orange-50', border: 'border-red-100' },
  { title: 'Photo Walk', icon: '📸', desc: 'Capture Chennai\'s beauty', vibes: 'artsy,nature', categories: 'photography,temples-heritage', color: 'from-pink-50 to-rose-50', border: 'border-pink-100' },
];

const SEVERITY_CLASSES: Record<TrafficSeverity, string> = {
  clear: 'severity-clear',
  light: 'severity-light',
  moderate: 'severity-moderate',
  heavy: 'severity-heavy',
  standstill: 'severity-standstill',
};

const STATS = [
  { value: '12+', label: 'Curated spots' },
  { value: '10', label: 'Traffic corridors' },
  { value: '100%', label: 'Free to use' },
];

export default function Home() {
  const [trafficSummary, setTrafficSummary] = useState<TrafficSummary | null>(null);

  useEffect(() => {
    fetch('/api/traffic?summary=true')
      .then(r => r.ok ? r.json() : null)
      .then(setTrafficSummary)
      .catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-sand -mt-16">
      {/* Hero */}
      <section className="hero-gradient text-white pt-32 pb-24 px-4 relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live traffic intelligence for Chennai
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1] animate-fade-in-up">
            Plan your weekend.
            <br />
            <span className="gradient-text">Dodge the traffic.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            The free weekend planner built for people who LIVE in Chennai.
            Traffic-smart itineraries so you spend time enjoying, not stuck on OMR.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <Link
              href="/plan"
              className="btn-primary text-lg px-10 py-4 animate-pulse-glow"
            >
              Plan My Weekend
            </Link>
            <Link
              href="/explore"
              className="px-8 py-4 text-white/60 hover:text-white font-medium rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-300 text-sm"
            >
              Browse Places
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-12 mt-14 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10 space-y-12">
        {/* Weather + Traffic Row */}
        <div className="grid md:grid-cols-2 gap-4 stagger-children">
          <WeatherWidget />

          {/* Traffic Summary */}
          {trafficSummary ? (
            <div className="card-premium p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Traffic Now
                </h3>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  {trafficSummary.isLive ? 'Live' : 'Estimated'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {trafficSummary.corridors.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 py-1.5">
                    <span className={`severity-dot ${SEVERITY_CLASSES[c.severity]}`} />
                    <span className="text-sm text-slate-600 truncate">{c.name}</span>
                    {c.avgDelay > 0 && (
                      <span className="text-xs text-slate-400 ml-auto">+{c.avgDelay}m</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card-premium p-5">
              <div className="skeleton h-4 w-24 mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton h-3 w-full" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Templates */}
        <section>
          <div className="text-center mb-8">
            <p className="section-label mb-2">Quick Start</p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              Pick a vibe, we&apos;ll handle the rest
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 stagger-children">
            {TEMPLATES.map((t) => (
              <Link
                key={t.title}
                href={`/plan?vibes=${t.vibes}&categories=${t.categories}`}
                className={`group relative rounded-2xl p-5 bg-gradient-to-br ${t.color} border ${t.border} transition-all duration-300 hover:shadow-medium hover:-translate-y-1`}
              >
                <span className="text-3xl mb-3 block group-hover:animate-float">{t.icon}</span>
                <h3 className="font-bold text-primary text-sm">{t.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.desc}</p>
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                    <path d="M2 6h8M7 3l3 3-3 3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="pb-16">
          <div className="text-center mb-10">
            <p className="section-label mb-2">How it works</p>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              Three steps to the perfect weekend
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {[
              {
                step: '01',
                title: 'Set your preferences',
                desc: 'Pick your mood, budget, group size, and starting area. We handle the rest.',
                gradient: 'from-amber-400 to-amber-500',
              },
              {
                step: '02',
                title: 'Get a smart plan',
                desc: 'We check live traffic, optimize routes, and build a timeline that avoids jams.',
                gradient: 'from-blue-400 to-blue-500',
              },
              {
                step: '03',
                title: 'Enjoy Chennai',
                desc: 'Navigate stop by stop with real-time traffic updates. Share with your gang.',
                gradient: 'from-emerald-400 to-emerald-500',
              },
            ].map((s) => (
              <div key={s.step} className="card-premium p-6 relative overflow-hidden group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white font-bold text-sm mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {s.step}
                </div>
                <h3 className="font-bold text-primary text-base mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
