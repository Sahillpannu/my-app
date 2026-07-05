import { create } from 'zustand';
import * as Location from 'expo-location';
import { Coords } from '@/src/types/trip';

interface LocationStore {
  currentLocation: Coords | null;
  heading: number;
  speedKph: number;
  permissionGranted: boolean;
  isWatching: boolean;
  requestPermission: () => Promise<boolean>;
  startWatching: () => Promise<void>;
  stopWatching: () => void;
}

let subscription: Location.LocationSubscription | null = null;

export const useLocationStore = create<LocationStore>((set, get) => ({
  currentLocation: null,
  heading: 0,
  speedKph: 0,
  permissionGranted: false,
  isWatching: false,

  requestPermission: async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    set({ permissionGranted: granted });
    return granted;
  },

  // Guarded against double-starting — important because Tabs keep screens
  // mounted, so a naive "start on mount" effect could fire more than once
  // across tab switches if not guarded. This check makes startWatching()
  // itself idempotent regardless of how many times it's called.
  startWatching: async () => {
    if (get().isWatching || subscription) return;
    set({ isWatching: true });

    subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 3000,
      },
      (loc) => {
        set({
          currentLocation: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
          heading: loc.coords.heading ?? 0,
          speedKph: loc.coords.speed ? Math.round(loc.coords.speed * 3.6) : 0,
        });
      }
    );
  },

  stopWatching: () => {
    subscription?.remove();
    subscription = null;
    set({ isWatching: false });
  },
}));
