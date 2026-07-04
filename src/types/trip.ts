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
