import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Coords } from '@/src/types/trip';

const COLORS = {
  bg: '#0B0D10',
  accent: '#FFB020',
  success: '#34D399',
  danger: '#F87171',
  routeFill: 'rgba(255,176,32,0.25)',
  textPrimary: '#F5F6F7',
  textTertiary: '#4A505C',
};

interface RouteMapViewProps {
  currentLocation: Coords | null;
  originCoords: Coords | null;
  destinationCoords: Coords | null;
  routeCoordinates: Coords[];
  followUser?: boolean;
  style?: any;
}

// Compute a bounding box around the given points and return a region
// that fits them with padding. Falls back to a sensible Australia-wide
// default when there's nothing to fit yet.
function regionForPoints(points: Coords[]) {
  if (points.length === 0) {
    return {
      latitude: -28.0,
      longitude: 135.0,
      latitudeDelta: 30,
      longitudeDelta: 30,
    };
  }
  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const padding = 0.05;
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(maxLat - minLat + padding, 0.05),
    longitudeDelta: Math.max(maxLon - minLon + padding, 0.05),
  };
}

export default function RouteMapView({
  currentLocation,
  originCoords,
  destinationCoords,
  routeCoordinates,
  followUser = false,
  style,
}: RouteMapViewProps) {
  const mapRef = useRef<InstanceType<typeof MapView>>(null);

  const fitPoints: Coords[] = [];
  if (originCoords) fitPoints.push(originCoords);
  if (destinationCoords) fitPoints.push(destinationCoords);
  if (routeCoordinates.length > 0) fitPoints.push(...routeCoordinates);

  const initialRegion = regionForPoints(
    currentLocation ? [currentLocation] : fitPoints
  );

  // Re-fit whenever the route geometry or endpoints change, unless we're
  // actively following the user during navigation.
  useEffect(() => {
    if (followUser) return;
    if (fitPoints.length < 2) return;
    mapRef.current?.fitToCoordinates(fitPoints, {
      edgePadding: { top: 120, right: 60, bottom: 200, left: 60 },
      animated: true,
    });
  }, [routeCoordinates, originCoords, destinationCoords, followUser]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        mapType={Platform.select({
          ios: 'mutedStandard',
          android: 'standard',
          default: 'standard',
        })}
        showsUserLocation
        followsUserLocation={followUser}
        showsTraffic={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        tintColor={COLORS.accent}
      >
        {routeCoordinates.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={COLORS.accent}
              strokeWidth={5}
              strokeColors={[COLORS.accent]}
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={COLORS.routeFill}
              strokeWidth={11}
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}

        {originCoords && (
          <Marker coordinate={originCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.originMarker}>
              <View style={styles.originDot} />
            </View>
          </Marker>
        )}

        {destinationCoords && (
          <Marker coordinate={destinationCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.destMarker}>
              <View style={styles.destDot} />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {routeCoordinates.length > 0
            ? `${routeCoordinates.length} ROUTE POINTS`
            : currentLocation
            ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
            : 'ACQUIRING GPS...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, overflow: 'hidden' },
  originMarker: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(52,211,153,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  originDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2, borderColor: COLORS.bg,
  },
  destMarker: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(248,113,113,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  destDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.danger,
    borderWidth: 2, borderColor: COLORS.bg,
  },
  badge: {
    position: 'absolute', bottom: 14, alignSelf: 'center',
    backgroundColor: 'rgba(11,13,16,0.85)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  badgeText: { color: COLORS.textPrimary, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
