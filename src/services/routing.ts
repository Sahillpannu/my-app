import { Coords, BackendRouteResponse } from '@/src/types/trip';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface VehiclePayload {
  heightMetres: number;
  widthMetres: number;
  lengthMetres: number;
  gcmTonnes: number;
  dangerousGoods: boolean;
}

export class RouteCoverageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RouteCoverageError';
  }
}

export async function computeRealRoute(
  origin: Coords,
  destination: Coords,
  vehicle: VehiclePayload
): Promise<BackendRouteResponse> {
  console.log('[DEBUG] Fetching:', `${BACKEND_URL}/api/route`);

  const response = await fetch(`${BACKEND_URL}/api/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, vehicle }),
  });

  console.log('[DEBUG] Response status:', response.status);

  if (response.status === 422) {
    const body = await response.json();
    throw new RouteCoverageError(
      body.detail || 'This route is outside the current routing coverage area.'
    );
  }

  if (!response.ok) {
    throw new Error(`Route request failed with status ${response.status}`);
  }

  return response.json();
}
