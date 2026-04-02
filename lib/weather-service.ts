import { WeatherData } from '../types';

const weatherCache: { data: WeatherData | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_DURATION = 30 * 60 * 1000; // 30 min

const CHENNAI_LAT = 13.0827;
const CHENNAI_LNG = 80.2707;

function mapWeatherCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear sky', icon: '☀️' };
  if (code <= 3) return { condition: 'Partly cloudy', icon: '⛅' };
  if (code <= 48) return { condition: 'Foggy', icon: '🌫️' };
  if (code <= 57) return { condition: 'Drizzle', icon: '🌦️' };
  if (code <= 67) return { condition: 'Rainy', icon: '🌧️' };
  if (code <= 77) return { condition: 'Snowy', icon: '❄️' };
  if (code <= 82) return { condition: 'Rain showers', icon: '🌧️' };
  if (code <= 86) return { condition: 'Snow showers', icon: '❄️' };
  if (code <= 99) return { condition: 'Thunderstorm', icon: '⛈️' };
  return { condition: 'Unknown', icon: '🌡️' };
}

export async function getWeather(): Promise<WeatherData> {
  if (weatherCache.data && Date.now() - weatherCache.timestamp < CACHE_DURATION) {
    return weatherCache.data;
  }

  try {
    // Primary: Open-Meteo (completely free, no key)
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${CHENNAI_LAT}&longitude=${CHENNAI_LNG}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=precipitation_probability_max&timezone=Asia/Kolkata&forecast_days=1`
    );

    if (res.ok) {
      const data = await res.json();
      const current = data.current;
      const { condition, icon } = mapWeatherCode(current.weather_code);

      const weather: WeatherData = {
        temperature: Math.round(current.temperature_2m),
        condition,
        icon,
        humidity: current.relative_humidity_2m,
        rainChance: data.daily?.precipitation_probability_max?.[0] ?? 0,
        windSpeed: Math.round(current.wind_speed_10m),
        isLive: true,
      };

      weatherCache.data = weather;
      weatherCache.timestamp = Date.now();
      return weather;
    }
    throw new Error('Open-Meteo failed');
  } catch {
    // Fallback: static reasonable Chennai weather
    return {
      temperature: 32,
      condition: 'Partly cloudy',
      icon: '⛅',
      humidity: 70,
      rainChance: 20,
      windSpeed: 12,
      isLive: false,
    };
  }
}

export function getWeatherAdvice(weather: WeatherData): string | null {
  if (weather.rainChance > 60) {
    return '🌧️ High chance of rain — consider indoor activities or carry an umbrella!';
  }
  if (weather.temperature > 38) {
    return '🔥 Extreme heat — stay hydrated, prefer AC/indoor spots between 12-4 PM.';
  }
  if (weather.temperature > 35) {
    return '☀️ Hot day ahead — outdoor activities best before 10 AM or after 5 PM.';
  }
  if (weather.windSpeed > 30) {
    return '💨 Windy conditions — beach visits might be uncomfortable.';
  }
  return null;
}

export function shouldForceIndoor(weather: WeatherData, timeSlot: string): boolean {
  if (weather.rainChance > 70) return true;
  if (weather.temperature > 38 && timeSlot === 'afternoon') return true;
  return false;
}
