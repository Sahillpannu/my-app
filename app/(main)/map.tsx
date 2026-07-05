import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLocationStore } from '@/src/stores/locationStore';
import { useTripStore } from '@/src/stores/tripStore';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import MockMapView from '@/src/components/map/MockMapView';
import SearchBar from '@/src/components/map/SearchBar';
import { SearchResult, Coords } from '@/src/types/trip';
import { reverseGeocode } from '@/src/services/geocoding';
import { APP_CONFIG } from '@/src/config/app';

const COLORS = {
  bg: '#0B0D10',
  surface: '#16191E',
  surfaceRaised: '#1D2127',
  border: '#262B33',
  accent: '#FFB020',
  accentDim: '#3D3220',
  textPrimary: '#F5F6F7',
  textSecondary: '#7C8390',
  textTertiary: '#4A505C',
  success: '#34D399',
  danger: '#F87171',
  dangerDim: '#3A1F1F',
};

type MapMode = 'IDLE' | 'ROUTE_PREVIEW' | 'NAVIGATING';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Snap points as fractions of screen height (from bottom)
const SNAP_COLLAPSED = SCREEN_HEIGHT * 0.22;
const SNAP_HALF = SCREEN_HEIGHT * 0.50;

export default function MapScreen() {
  const { currentLocation, permissionGranted, requestPermission, startWatching } =
    useLocationStore();
  const { trips, startTrip, completeTrip } = useTripStore();
  const { getActiveProfile } = useVehicleStore();

  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [originCoords, setOriginCoords] = useState<Coords | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coords | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('IDLE');
  const [mockDistance, setMockDistance] = useState(0);
  const [mockDuration, setMockDuration] = useState(0);

  // Bottom sheet animation — translateY from 0 (fully visible) upward (hidden)
  const sheetY = useRef(new Animated.Value(SCREEN_HEIGHT - SNAP_COLLAPSED)).current;
  const currentSnapY = useRef(SCREEN_HEIGHT - SNAP_COLLAPSED);

  const insets = useSafeAreaInsets();
  const activeProfile = getActiveProfile();

  const snapTo = useCallback((targetY: number, duration = 280) => {
    currentSnapY.current = targetY;
    Animated.spring(sheetY, {
      toValue: targetY,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  }, [sheetY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 4,
      onPanResponderMove: (_, gs) => {
        const newY = currentSnapY.current + gs.dy;
        const minY = SCREEN_HEIGHT - SNAP_HALF;
        const maxY = SCREEN_HEIGHT - SNAP_COLLAPSED;
        sheetY.setValue(Math.max(minY, Math.min(maxY, newY)));
      },
      onPanResponderRelease: (_, gs) => {
        const threshold = 60;
        if (gs.dy < -threshold) {
          // Dragged up → expand
          const newSnap = SCREEN_HEIGHT - SNAP_HALF;
          currentSnapY.current = newSnap;
          Animated.spring(sheetY, { toValue: newSnap, useNativeDriver: true, damping: 20, stiffness: 150 }).start();
        } else if (gs.dy > threshold) {
          // Dragged down → collapse
          const newSnap = SCREEN_HEIGHT - SNAP_COLLAPSED;
          currentSnapY.current = newSnap;
          Animated.spring(sheetY, { toValue: newSnap, useNativeDriver: true, damping: 20, stiffness: 150 }).start();
        } else {
          // Snap back
          Animated.spring(sheetY, { toValue: currentSnapY.current, useNativeDriver: true, damping: 20, stiffness: 150 }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    requestPermission().then((granted) => {
      if (granted) startWatching();
    });
  }, []);

  useEffect(() => {
    if (currentLocation && !originCoords) {
      reverseGeocode(currentLocation).then((name) => {
        setOriginText(name);
        setOriginCoords(currentLocation);
      });
    }
  }, [currentLocation]);

  const computeMockDistance = (a: Coords, b: Coords): number => {
    const R = 6371;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
    const lat1 = (a.latitude * Math.PI) / 180;
    const lat2 = (b.latitude * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const handleOriginSelect = useCallback((result: SearchResult) => {
    setOriginText(result.shortName);
    setOriginCoords(result.coords);
  }, []);

  const handleDestinationSelect = useCallback(
    (result: SearchResult) => {
      setDestinationText(result.shortName);
      setDestinationCoords(result.coords);

      if (originCoords) {
        const distKm = computeMockDistance(originCoords, result.coords);
        const durMin = (distKm / APP_CONFIG.averageSpeedKph) * 60;
        setMockDistance(distKm);
        setMockDuration(durMin);
        setMapMode('ROUTE_PREVIEW');
        snapTo(SCREEN_HEIGHT - SNAP_HALF);
      }
    },
    [originCoords, snapTo]
  );

  const clearRoute = () => {
    setDestinationText('');
    setDestinationCoords(null);
    setMockDistance(0);
    setMockDuration(0);
    setMapMode('IDLE');
    snapTo(SCREEN_HEIGHT - SNAP_COLLAPSED);
  };

  const handleStartNavigation = async () => {
    if (!originCoords || !destinationCoords) return;

    if (!activeProfile) {
      Alert.alert(
        'No vehicle selected',
        'Add a vehicle profile in Settings before starting a trip.'
      );
      return;
    }

    setMapMode('NAVIGATING');
    snapTo(SCREEN_HEIGHT - SNAP_COLLAPSED);

    await startTrip({
      origin: originText,
      destination: destinationText,
      originCoords,
      destinationCoords,
      distanceKm: mockDistance,
      durationMinutes: mockDuration,
      startedAt: new Date().toISOString(),
      vehicleClass: activeProfile.vehicleClass,
    });
  };

  const handleStopNavigation = async () => {
    const inProgress = trips.find((t) => t.status === 'IN_PROGRESS');
    if (inProgress) {
      await completeTrip(inProgress.id);
    }
    clearRoute();
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <MockMapView
        style={StyleSheet.absoluteFillObject}
        currentLocation={currentLocation}
        originCoords={originCoords}
        destinationCoords={destinationCoords}
      />

      {/* Top bar: vehicle chip */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.profileChip}>
          <Text style={styles.profileChipText}>
            {activeProfile ? activeProfile.name.toUpperCase() : 'NO VEHICLE SET'}
          </Text>
        </View>
      </SafeAreaView>

      {/* Search bar — hidden during navigation */}
      {mapMode !== 'NAVIGATING' && (
        <View style={[styles.searchBarWrapper, { top: insets.top + 52 }]}>
          <SearchBar
            originText={originText}
            destinationText={destinationText}
            onOriginSelect={handleOriginSelect}
            onDestinationSelect={handleDestinationSelect}
            onOriginTextChange={setOriginText}
            onDestinationTextChange={setDestinationText}
            currentLocation={currentLocation}
            onClear={clearRoute}
          />
        </View>
      )}

      {/* Navigation HUD */}
      {mapMode === 'NAVIGATING' && (
        <SafeAreaView edges={['top']} style={styles.navHud}>
          <View style={styles.navCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.navDestination} numberOfLines={1}>
                → {destinationText}
              </Text>
              <Text style={styles.navDistance}>
                {mockDistance.toFixed(1)} km · {Math.round(mockDuration)} min
              </Text>
            </View>
            <TouchableOpacity style={styles.stopBtn} onPress={handleStopNavigation}>
              <Text style={styles.stopBtnText}>×</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* Custom bottom sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}
      >
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={styles.handleBar} />
        </View>

        {/* Sheet content */}
        {mapMode === 'ROUTE_PREVIEW' && destinationCoords ? (
          <View style={styles.routePanel}>
            <Text style={styles.routeTitle}>{destinationText}</Text>
            <Text style={styles.routeSubtitle}>
              {mockDistance.toFixed(1)} km · {Math.round(mockDuration)} min · straight-line estimate
            </Text>

            <View style={styles.warningBanner}>
              <Text style={styles.warningText}>
                NHVR network data not yet loaded — route shown is a straight-line estimate only, not a real truck-legal path.
              </Text>
            </View>

            <View style={styles.routeActions}>
              <TouchableOpacity style={styles.startBtn} onPress={handleStartNavigation}>
                <Text style={styles.startBtnText}>START NAVIGATION</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearBtn} onPress={clearRoute}>
                <Text style={styles.clearBtnText}>CLEAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.idlePanel}>
            <Text style={styles.idleTitle}>
              {currentLocation ? 'Search a destination above' : 'Acquiring your location...'}
            </Text>
            {!permissionGranted && (
              <Text style={styles.idleSubtitle}>
                Location permission is required for navigation.
              </Text>
            )}
          </View>
        )}
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 },
  profileChip: {
    marginLeft: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22,25,30,0.9)',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  profileChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  searchBarWrapper: { position: 'absolute', left: 0, right: 0, zIndex: 90 },
  navHud: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  navCard: {
    margin: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navDestination: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  navDistance: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  stopBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.dangerDim,
    alignItems: 'center', justifyContent: 'center',
  },
  stopBtnText: { color: COLORS.danger, fontSize: 18, fontWeight: '700' },
  // Custom bottom sheet styles
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  routePanel: { paddingHorizontal: 20, paddingTop: 4 },
  routeTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  routeSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, marginBottom: 14 },
  warningBanner: {
    backgroundColor: COLORS.accentDim,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    marginBottom: 16,
  },
  warningText: { fontSize: 12, color: COLORS.accent, lineHeight: 18 },
  routeActions: { gap: 10 },
  startBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startBtnText: { color: '#1A1206', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  clearBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  clearBtnText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  idlePanel: { paddingHorizontal: 20, paddingTop: 8, alignItems: 'center' },
  idleTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  idleSubtitle: { fontSize: 12, color: COLORS.textTertiary, marginTop: 6, textAlign: 'center' },
});
