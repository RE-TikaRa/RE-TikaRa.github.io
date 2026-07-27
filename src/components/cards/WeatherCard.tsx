import { useEffect, useState } from 'react';

type Mood = 'clear' | 'cloudy' | 'fog' | 'storm' | 'rain' | 'neutral';

interface WeatherView {
  location: string;
  temp: number;
  icon: string;
  description: string;
  source: string;
}

const weatherCodeMap: Record<number, { icon: string; description: string }> = {
  0: { icon: 'fa-solid fa-sun', description: '晴' },
  1: { icon: 'fa-solid fa-cloud-sun', description: '基本晴朗' },
  2: { icon: 'fa-solid fa-cloud', description: '部分多云' },
  3: { icon: 'fa-solid fa-cloud', description: '阴天' },
  45: { icon: 'fa-solid fa-smog', description: '雾' },
  48: { icon: 'fa-solid fa-smog', description: '冻雾' },
  51: { icon: 'fa-solid fa-cloud-rain', description: '小雨' },
  53: { icon: 'fa-solid fa-cloud-rain', description: '中雨' },
  55: { icon: 'fa-solid fa-cloud-showers-heavy', description: '大雨' },
  61: { icon: 'fa-solid fa-cloud-rain', description: '小雨' },
  63: { icon: 'fa-solid fa-cloud-rain', description: '中雨' },
  65: { icon: 'fa-solid fa-cloud-showers-heavy', description: '大雨' },
  80: { icon: 'fa-solid fa-cloud-showers-heavy', description: '阵雨' },
  81: { icon: 'fa-solid fa-cloud-showers-heavy', description: '中度阵雨' },
  82: { icon: 'fa-solid fa-cloud-showers-heavy', description: '猛烈阵雨' },
  95: { icon: 'fa-solid fa-bolt', description: '雷暴' },
};

function classifyWeatherMood(code: number): Mood {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code === 95) return 'storm';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain';
  return 'neutral';
}

function applyWeatherAtmosphere(code: number): void {
  const root = document.documentElement;
  const mood = classifyWeatherMood(code);
  root.setAttribute('data-weather', mood);
  const rainOpacityMap: Record<Mood, string> = {
    clear: '0.06',
    cloudy: '0.1',
    fog: '0.14',
    rain: '0.24',
    storm: '0.32',
    neutral: '0.12',
  };
  root.style.setProperty('--weather-rain-opacity', rainOpacityMap[mood] || '0.12');
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&accept-language=zh-CN`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('reverse geocode failed');
    const data = await response.json();
    const address = data?.address || {};
    const city = address.city || address.town || address.village || address.county || '';
    const state = address.state || address.region || '';
    const country = address.country || '';
    const parts = [city, state].filter(Boolean);
    const label = parts.length ? parts.join(' · ') : country;
    return label || '当前位置';
  } catch {
    return '当前位置';
  }
}

function isGeolocationPermissionDenied(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: number; message?: string };
  if (typeof err.code === 'number' && err.code === 1) return true;
  const message = typeof err.message === 'string' ? err.message.toLowerCase() : '';
  return message.includes('geolocation') && message.includes('denied');
}

function buildVirtualWeather(): WeatherView {
  const codes = Object.keys(weatherCodeMap);
  const randomCode = Number(codes[Math.floor(Math.random() * codes.length)]);
  const info = weatherCodeMap[randomCode];
  const temp = Math.floor(Math.random() * (30 - 10 + 1)) + 10;
  applyWeatherAtmosphere(randomCode);
  return { location: 'ALp_Studio', temp, icon: info.icon, description: info.description, source: '模拟' };
}

export default function WeatherCard() {
  const [view, setView] = useState<WeatherView | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
        });
        const { latitude, longitude } = position.coords;
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const code = Number(data.current.weather_code);
        const info = weatherCodeMap[code] || { icon: 'fa-solid fa-question', description: '未知' };
        const location = await reverseGeocode(latitude, longitude);
        applyWeatherAtmosphere(code);
        if (!cancelled) {
          setView({ location, temp: data.current.temperature_2m, icon: info.icon, description: info.description, source: '定位' });
        }
      } catch (error) {
        if (!isGeolocationPermissionDenied(error)) {
          console.error('获取天气失败:', error);
        }
        if (!cancelled) setView(buildVirtualWeather());
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!view) return null;

  return (
    <section id="weather-card" className="blueprint-frame weather-card">
      <div className="frame-label">
        <span className="frame-label__mark data-field">[01]</span>
        <span className="frame-label__text">// WEATHER.probe</span>
        <span className="weather-source data-field" id="weather-source">{view.source}</span>
      </div>
      <div className="weather-body">
        <div className="weather-main">
          <span className="weather-temp data-field">{Math.round(view.temp)}°</span>
          <i className={`weather-icon ${view.icon}`} aria-hidden="true"></i>
        </div>
        <div className="weather-location">{view.location}</div>
        <div className="weather-description">{view.description}</div>
      </div>
    </section>
  );
}
