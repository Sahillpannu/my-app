export interface Coords {
  latitude: number;
  longitude: number;
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  originCoords: Coords;
  destinationCoords: Coords;
  distanceKm: number;
  durationMinutes: number;
  startedAt: string;
  completedAt: string | null;
  vehicleClass: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface SearchResult {
  id: string;
  displayName: string;
  shortName: string;
  coords: Coords;
}

export interface BackendTurn {
  type: string;
  streetName: string | null;
  distanceMetres: number;
  durationSeconds: number;
  instruction: string;
}

export interface BackendRouteResponse {
  totalDistanceKm: number;
  totalDurationMinutes: number;
  turns: BackendTurn[];
  segments: { coordinates: Coords[] }[];
  coverageMode: string;
  warning: string | null;
}
