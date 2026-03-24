export interface PhotoResult {
  url: string;
  photographer: string;
  photographerUrl: string;
}

// In-memory cache (backed by localStorage for persistence)
const cache = new Map<string, { photo: PhotoResult; fetched: number }>();
const MAX_CACHE = 30;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const STORAGE_KEY = 'destinationPhotoCache';

const pendingFetches = new Map<string, Promise<PhotoResult>>();

// Load persisted cache on startup
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const entries: Record<string, { photo: PhotoResult; fetched: number }> = JSON.parse(stored);
    for (const [k, v] of Object.entries(entries)) {
      cache.set(k, v);
    }
  }
} catch { /* ignore corrupt cache */ }

function persistCache() {
  try {
    const obj: Record<string, { photo: PhotoResult; fetched: number }> = {};
    for (const [k, v] of cache) obj[k] = v;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch { /* quota exceeded — ignore */ }
}

/** Returns cached photo synchronously if available (even if stale). */
export function getCachedPhoto(destination: string): PhotoResult | null {
  const key = destination.toLowerCase();
  return cache.get(key)?.photo ?? null;
}

/** Returns true if cached photo is within TTL. */
export function isPhotoCacheFresh(destination: string): boolean {
  const key = destination.toLowerCase();
  const entry = cache.get(key);
  return !!entry && (Date.now() - entry.fetched < CACHE_TTL);
}

export async function fetchDestinationPhoto(
  destination: string,
  signal?: AbortSignal
): Promise<PhotoResult> {
  const key = destination.toLowerCase();

  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetched < CACHE_TTL) {
    return cached.photo;
  }

  // Deduplicate concurrent fetches
  const pending = pendingFetches.get(key);
  if (pending) return pending;

  const fetchPromise = fetchPhotoInner(destination, key, signal);
  pendingFetches.set(key, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    pendingFetches.delete(key);
  }
}

async function fetchPhotoInner(
  destination: string,
  cacheKey: string,
  signal?: AbortSignal
): Promise<PhotoResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  if (signal) {
    if (signal.aborted) { clearTimeout(timeout); throw new DOMException('Aborted', 'AbortError'); }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const baseUrl = import.meta.env.DEV ? '/pexels-api' : 'https://api.pexels.com';
    const url = `${baseUrl}/v1/search?query=${encodeURIComponent(destination + ' travel')}&orientation=landscape&per_page=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Authorization': import.meta.env.VITE_PEXELS_API_KEY || '',
      },
    });

    if (!res.ok) throw new Error('photoFetchFailed');
    const data = await res.json();

    if (!data.photos?.length) throw new Error('noPhotoFound');

    const result = data.photos[0];
    const photo: PhotoResult = {
      url: result.src.landscape,
      photographer: result.photographer,
      photographerUrl: result.photographer_url,
    };

    // LRU eviction
    if (cache.size >= MAX_CACHE) {
      let oldest = '';
      let oldestTime = Infinity;
      for (const [k, v] of cache) {
        if (v.fetched < oldestTime) { oldest = k; oldestTime = v.fetched; }
      }
      if (oldest) cache.delete(oldest);
    }
    cache.set(cacheKey, { photo, fetched: Date.now() });
    persistCache();

    return photo;
  } finally {
    clearTimeout(timeout);
  }
}
