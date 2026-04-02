import { NextResponse } from 'next/server';

const CHENNAI_LAT = 13.0827;
const CHENNAI_LNG = 80.2707;

let weatherCache: { data: any; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_DURATION = 30 * 60 * 1000;

function mapWeatherCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear sky', icon: '☀️' };
  if (code <= 3) return { condition: 'Partly cloudy', icon: '⛅' };
  if (code <= 48) return { condition: 'Foggy', icon: '🌫️' };
  if (code <= 67) return { condition: 'Rainy', icon: '🌧️' };
  if (code <= 82) return { condition: 'Rain showers', icon: '🌧️' };
  if (code <= 99) return { condition: 'Thunderstorm', icon: '⛈️' };
  return { condition: 'Unknown', icon: '🌡️' };
}

export async function GET() {
  if (weatherCache.data && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
    return NextResponse.json(weatherCache.data);
  }

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${CHENNAI_LAT}&longitude=${CHENNAI_LNG}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=Asia/Kolkata&forecast_days=1`,
      { next: { revalidate: 1800 } }
    );

    if (res.ok) {
      const data = await res.json();
      const current = data.current;
      const { condition, icon } = mapWeatherCode(current.weather_code);

      const weather = {
        temperature: Math.round(current.temperature_2m),
        condition,
        icon,
        humidity: current.relative_humidity_2m,
        rainChance: data.daily?.precipitation_probability_max?.[0] ?? 0,
        windSpeed: Math.round(current.wind_speed_10m),
        isLive: true,
      };

      weatherCache = { data: weather, timestamp: Date.now() };
      return NextResponse.json(weather);
    }
    throw new Error('Open-Meteo failed');
  } catch {
    return NextResponse.json({
      temperature: 32, condition: 'Partly cloudy', icon: '⛅',
      humidity: 70, rainChance: 20, windSpeed: 12, isLive: false,
    });
  }
}
