import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Coords } from '@/src/types/trip';

const COLORS = {
  mapBg: '#1A2035',
  gridLine: 'rgba(255,255,255,0.06)',
  road: '#2A3352',
  accent: '#FFB020',
  routeLine: '#FFB020',
};

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
  const hasRoute = originCoords && destinationCoords;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.gridContainer}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLineH, { top: `${i * 11}%` as any }]} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: `${i * 17}%` as any }]} />
        ))}
      </View>

      <View style={styles.road1} />
      <View style={styles.road2} />
      <View style={styles.road3} />

      {hasRoute && <View style={styles.routeLine} />}

      {currentLocation && (
        <View style={styles.locationDotWrapper}>
          <View style={styles.locationDotPulse} />
          <View style={styles.locationDot} />
        </View>
      )}

      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {hasRoute
            ? 'ROUTE PREVIEW · MAPLIBRE PENDING'
            : currentLocation
            ? `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
            : 'ACQUIRING GPS...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.mapBg, overflow: 'hidden' },
  gridContainer: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: COLORS.gridLine },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: COLORS.gridLine },
  road1: { position: 'absolute', top: '35%', left: 0, right: 0, height: 6, backgroundColor: COLORS.road },
  road2: { position: 'absolute', top: 0, bottom: 0, left: '40%', width: 5, backgroundColor: COLORS.road },
  road3: {
    position: 'absolute', top: '60%', left: '20%', right: '10%', height: 4,
    backgroundColor: COLORS.road, opacity: 0.7, transform: [{ rotate: '-8deg' }],
  },
  routeLine: {
    position: 'absolute', top: '30%', left: '15%', right: '15%', height: 3,
    backgroundColor: COLORS.routeLine, borderRadius: 2,
  },
  locationDotWrapper: {
    position: 'absolute', top: '48%', left: '48%',
    alignItems: 'center', justifyContent: 'center',
  },
  locationDotPulse: {
    position: 'absolute', width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,176,32,0.2)',
  },
  locationDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.accent, borderWidth: 3, borderColor: '#0B0D10',
  },
  badge: {
    position: 'absolute', bottom: 14, alignSelf: 'center',
    backgroundColor: 'rgba(11,13,16,0.85)',
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
  },
  badgeText: { color: '#F5F6F7', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
