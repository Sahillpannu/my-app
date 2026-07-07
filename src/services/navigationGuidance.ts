import * as Speech from 'expo-speech';
import { Coords } from '@/src/types/trip';

export const VOICE_THRESHOLDS_METRES = [1000, 500, 200] as const;
export const OFF_ROUTE_METRES = 50;
export const OFF_ROUTE_REROUTE_MS = 10_000;

function haversineMetres(a: Coords, b: Coords): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function distanceToSegmentMetres(point: Coords, a: Coords, b: Coords): number {
  const latScale = 111_320;
  const lonScale = 111_320 * Math.cos((point.latitude * Math.PI) / 180);

  const px = point.longitude * lonScale;
  const py = point.latitude * latScale;
  const ax = a.longitude * lonScale;
  const ay = a.latitude * latScale;
  const bx = b.longitude * lonScale;
  const by = b.latitude * latScale;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return haversineMetres(point, a);

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const proj: Coords = {
    latitude: (ay + t * dy) / latScale,
    longitude: (ax + t * dx) / lonScale,
  };
  return haversineMetres(point, proj);
}

export function distanceToRouteMetres(point: Coords, route: Coords[]): number {
  if (route.length === 0) return Infinity;
  if (route.length === 1) return haversineMetres(point, route[0]);

  let min = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    const d = distanceToSegmentMetres(point, route[i], route[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

export async function speakInstruction(text: string): Promise<void> {
  if (!text.trim()) return;
  if (await Speech.isSpeakingAsync()) {
    Speech.stop();
  }
  Speech.speak(text, { language: 'en-AU', rate: 0.95 });
}

export function stopSpeaking(): void {
  Speech.stop();
}
