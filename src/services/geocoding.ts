import { SearchResult, Coords } from '@/src/types/trip';
import { APP_CONFIG } from '@/src/config/app';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

interface CacheEntry {
  results: SearchResult[];
  cachedAt: number;
}
const searchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

let latestRequestId = 0;

export async function searchPlaces(
  query: string,
  nearCoords?: Coords
): Promise<{ results: SearchResult[]; requestId: number }> {
  const requestId = ++latestRequestId;

  if (!query || query.trim().length < 3) {
    return { results: [], requestId };
  }

  const cacheKey = query.trim().toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { results: cached.results, requestId };
  }

  const params = new URLSearchParams({
    q: `${query}, ${APP_CONFIG.countryName}`,
    format: 'json',
    addressdetails: '1',
    limit: '6',
    countrycodes: APP_CONFIG.countryCode,
  });

  if (nearCoords) {
    params.append('lat', nearCoords.latitude.toString());
    params.append('lon', nearCoords.longitude.toString());
  }

  const url = `${NOMINATIM_URL}/search?${params}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Truckio/1.0 (Australian truck navigation app)' },
  });

  if (!res.ok) throw new Error('Geocoding failed');

  const data = await res.json();

  const results: SearchResult[] = data.map((item: any) => ({
    id: item.place_id.toString(),
    displayName: item.display_name,
    shortName:
      item.address?.road ||
      item.address?.suburb ||
      item.address?.city ||
      item.display_name.split(',')[0],
    coords: {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    },
  }));

  searchCache.set(cacheKey, { results, cachedAt: Date.now() });
  return { results, requestId };
}

export async function reverseGeocode(coords: Coords): Promise<string> {
  const params = new URLSearchParams({
    lat: coords.latitude.toString(),
    lon: coords.longitude.toString(),
    format: 'json',
  });

  const res = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
    headers: { 'User-Agent': 'Truckio/1.0 (Australian truck navigation app)' },
  });

  if (!res.ok) return 'Current Location';
  const data = await res.json();

  return (
    data.address?.road ||
    data.address?.suburb ||
    data.address?.city ||
    'Current Location'
  );
}
