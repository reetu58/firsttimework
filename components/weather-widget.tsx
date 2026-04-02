'use client';
import { useState, useEffect } from 'react';
import { WeatherData } from '../types';

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch('/api/weather');
        if (res.ok) {
          setWeather(await res.json());
        }
      } catch {
        setWeather({
          temperature: 32, condition: 'Partly cloudy', icon: '⛅',
          humidity: 70, rainChance: 20, windSpeed: 12, isLive: false,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="card-premium p-5">
        <div className="flex items-center gap-4">
          <div className="skeleton w-14 h-14 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-6 w-20" />
            <div className="skeleton h-3 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Chennai Weather
        </h3>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
          {weather.isLive ? 'Live' : 'Estimated'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-3xl">
          {weather.icon}
        </div>
        <div className="flex-1">
          <p className="text-3xl font-bold text-primary">{weather.temperature}°</p>
          <p className="text-sm text-slate-500">{weather.condition}</p>
        </div>
        <div className="flex flex-col gap-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
            {weather.humidity}% humidity
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />
            {weather.rainChance}% rain
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            {weather.windSpeed} km/h
          </span>
        </div>
      </div>

      {weather.rainChance > 60 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          High chance of rain — consider indoor activities
        </div>
      )}
      {weather.temperature > 38 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Extreme heat — prefer indoor spots between 12-4 PM
        </div>
      )}
    </div>
  );
}
