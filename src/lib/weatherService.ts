export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  precipProbability: number;
  weatherCode: number;
}

export interface WeatherSummary {
  avgHigh: number;
  avgLow: number;
  maxPrecipProb: number;
  dominantWeatherCode: number;
  forecasts: DailyForecast[];
}

// In-memory cache (backed by localStorage for persistence)
const cache = new Map<string, { summary: WeatherSummary; fetched: number }>();
const MAX_CACHE = 20;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const STORAGE_KEY = 'weatherCache';

// Debounce: track pending fetches by cache key
const pendingFetches = new Map<string, Promise<WeatherSummary>>();

// Load persisted cache on startup
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const entries: Record<string, { summary: WeatherSummary; fetched: number }> = JSON.parse(stored);
    for (const [k, v] of Object.entries(entries)) {
      cache.set(k, v);
    }
  }
} catch { /* ignore corrupt cache */ }

function persistCache() {
  try {
    const obj: Record<string, { summary: WeatherSummary; fetched: number }> = {};
    for (const [k, v] of cache) obj[k] = v;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch { /* quota exceeded — ignore */ }
}

/** @internal — exposed for tests only */
export function _clearCache() {
  cache.clear();
  pendingFetches.clear();
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

/** Returns cached weather synchronously if available (even if stale). */
export function getCachedWeather(
  destination: string, tripStart: string, tripEnd: string
): WeatherSummary | null {
  const key = `${destination}|${tripStart}|${tripEnd}`;
  return cache.get(key)?.summary ?? null;
}

/** Returns true if cached data is within TTL. */
export function isWeatherCacheFresh(
  destination: string, tripStart: string, tripEnd: string
): boolean {
  const key = `${destination}|${tripStart}|${tripEnd}`;
  const entry = cache.get(key);
  return !!entry && (Date.now() - entry.fetched < CACHE_TTL);
}

export async function fetchWeather(
  destination: string,
  tripStart: string,
  tripEnd: string,
  signal?: AbortSignal,
  coords?: { latitude: number; longitude: number }
): Promise<WeatherSummary> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 16);

  const start = new Date(tripStart);
  const end = new Date(tripEnd);
  const windowStart = start > today ? start : today;
  const windowEnd = end < horizon ? end : horizon;

  if (windowStart > windowEnd) {
    throw new Error('outsideForecastWindow');
  }

  const cacheKey = `${destination}|${tripStart}|${tripEnd}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetched < CACHE_TTL) {
    return cached.summary;
  }

  // Deduplicate concurrent fetches for the same key
  const pending = pendingFetches.get(cacheKey);
  if (pending) return pending;

  const fetchPromise = fetchWeatherInner(destination, windowStart, windowEnd, cacheKey, signal, coords);
  pendingFetches.set(cacheKey, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    pendingFetches.delete(cacheKey);
  }
}

async function fetchWeatherInner(
  destination: string,
  windowStart: Date,
  windowEnd: Date,
  cacheKey: string,
  signal?: AbortSignal,
  coords?: { latitude: number; longitude: number }
): Promise<WeatherSummary> {
  // Track whether the *external* caller aborted (vs our internal timeout)
  let callerAborted = signal?.aborted ?? false;
  if (signal) {
    signal.addEventListener('abort', () => { callerAborted = true; }, { once: true });
  }

  const doFetch = async (): Promise<WeatherSummary> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // Chain external signal to our controller
    if (signal) {
      if (signal.aborted) { clearTimeout(timeout); throw new DOMException('Aborted', 'AbortError'); }
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    try {
      let latitude: number;
      let longitude: number;

      if (coords) {
        // Use stored coordinates — skip geocoding entirely
        latitude = coords.latitude;
        longitude = coords.longitude;
      } else {
        // Fall back to geocoding (for older trips without stored coords)
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl, { signal: controller.signal });
        if (!geoRes.ok) throw new Error('geocodingFailed');
        const geoData = await geoRes.json();

        if (!geoData.results?.length) {
          throw new Error('geocodingFailed');
        }

        ({ latitude, longitude } = geoData.results[0]);
      }

      const fmt = (d: Date) => d.toISOString().split('T')[0];
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&start_date=${fmt(windowStart)}&end_date=${fmt(windowEnd)}&timezone=auto`;

      const res = await fetch(forecastUrl, { signal: controller.signal });
      if (!res.ok) throw new Error('invalidWeatherResponse');
      const data = await res.json();

      const daily = data?.daily;
      if (!daily?.time?.length || !daily?.temperature_2m_max?.length) {
        throw new Error('invalidWeatherResponse');
      }
      const forecasts: DailyForecast[] = [];

      for (let i = 0; i < daily.time.length; i++) {
        if (i >= daily.temperature_2m_max.length || i >= daily.temperature_2m_min.length || i >= daily.weathercode.length) break;
        forecasts.push({
          date: daily.time[i],
          high: daily.temperature_2m_max[i],
          low: daily.temperature_2m_min[i],
          precipProbability: daily.precipitation_probability_max?.[i] ?? 0,
          weatherCode: daily.weathercode[i],
        });
      }

      if (forecasts.length === 0) {
        return { avgHigh: 0, avgLow: 0, maxPrecipProb: 0, dominantWeatherCode: 0, forecasts: [] };
      }

      const avgHigh = forecasts.reduce((s, f) => s + f.high, 0) / forecasts.length;
      const avgLow = forecasts.reduce((s, f) => s + f.low, 0) / forecasts.length;
      const maxPrecipProb = Math.max(...forecasts.map(f => f.precipProbability));
      const dominantWeatherCode = Math.max(...forecasts.map(f => f.weatherCode));

      const summary: WeatherSummary = { avgHigh, avgLow, maxPrecipProb, dominantWeatherCode, forecasts };

      // LRU eviction
      if (cache.size >= MAX_CACHE) {
        let oldest = '';
        let oldestTime = Infinity;
        for (const [key, val] of cache) {
          if (val.fetched < oldestTime) { oldest = key; oldestTime = val.fetched; }
        }
        if (oldest) cache.delete(oldest);
      }
      cache.set(cacheKey, { summary, fetched: Date.now() });
      persistCache();

      return summary;
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    return await doFetch();
  } catch (e: any) {
    // If the *caller* aborted (component unmount), don't retry
    if (callerAborted) throw e;
    // Don't retry known permanent failures
    if (e?.message === 'geocodingFailed' || e?.message === 'outsideForecastWindow' || e?.message === 'invalidWeatherResponse') {
      throw e;
    }
    // Retry once after 2s on transient failures (timeout, network errors)
    await new Promise(r => setTimeout(r, 2000));
    return await doFetch();
  }
}

export function weatherCondition(code: number): string {
  switch (code) {
    case 0: return 'Clear';
    case 1: return 'Mostly Clear';
    case 2: return 'Partly Cloudy';
    case 3: return 'Overcast';
    case 45: case 48: return 'Foggy';
    case 51: case 53: case 55: return 'Drizzle';
    case 61: case 63: case 65: return 'Rain';
    case 71: case 73: case 75: return 'Snow';
    case 77: return 'Sleet';
    case 80: case 81: case 82: return 'Showers';
    case 85: case 86: return 'Snow Showers';
    case 95: return 'Thunderstorm';
    case 96: case 99: return 'Hail Storm';
    default: return 'Variable';
  }
}

export function weatherIcon(code: number): string {
  switch (code) {
    case 0: return 'sun';
    case 1: return 'sun';
    case 2: return 'cloud-sun';
    case 3: return 'cloud';
    case 45: case 48: return 'cloud-fog';
    case 51: case 53: case 55: return 'cloud-drizzle';
    case 61: case 63: case 65: return 'cloud-rain';
    case 71: case 73: case 75: case 77: return 'cloud-snow';
    case 80: case 81: case 82: return 'cloud-rain-wind';
    case 85: case 86: return 'cloud-snow';
    case 95: return 'cloud-lightning';
    case 96: case 99: return 'cloud-lightning';
    default: return 'cloud';
  }
}
