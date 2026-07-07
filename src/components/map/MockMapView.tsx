import React from 'react';
import { Coords } from '@/src/types/trip';
import RouteMapView from '@/src/components/map/RouteMapView';

interface MockMapViewProps {
  currentLocation: Coords | null;
  originCoords: Coords | null;
  destinationCoords: Coords | null;
  style?: any;
}

export default function MockMapView({
  currentLocation,
  originCoords,
  destinationCoords,
  style,
}: MockMapViewProps) {
  return (
    <RouteMapView
      style={style}
      currentLocation={currentLocation}
      originCoords={originCoords}
      destinationCoords={destinationCoords}
      routeCoordinates={[]}
      followUser={false}
    />
  );
}
