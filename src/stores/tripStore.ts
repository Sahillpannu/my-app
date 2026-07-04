import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { Trip } from '@/src/types/trip';

interface TripStore {
  trips: Trip[];
  hydrated: boolean;
  currentUserId: string | null;
  hydrate: (userId: string) => Promise<void>;
  startTrip: (trip: Omit<Trip, 'id' | 'status' | 'completedAt'>) => Promise<Trip>;
  completeTrip: (id: string) => Promise<void>;
  cancelTrip: (id: string) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
}

const keyFor = (userId: string) => `truckio_trips_${userId}`;

const persist = async (userId: string, trips: Trip[]) => {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(trips));
};

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  hydrated: false,
  currentUserId: null,

  hydrate: async (userId: string) => {
    if (!userId) return;
    try {
      const raw = await AsyncStorage.getItem(keyFor(userId));
      const trips: Trip[] = raw ? JSON.parse(raw) : [];
      set({ trips, hydrated: true, currentUserId: userId });
    } catch {
      set({ trips: [], hydrated: true, currentUserId: userId });
    }
  },

  startTrip: async (tripData) => {
    const { currentUserId, trips } = get();
    if (!currentUserId) throw new Error('No user hydrated in tripStore');

    const closedOutTrips = trips.map((t) =>
      t.status === 'IN_PROGRESS'
        ? { ...t, status: 'CANCELLED' as const, completedAt: new Date().toISOString() }
        : t
    );

    const newTrip: Trip = {
      ...tripData,
      id: uuid.v4() as string,
      status: 'IN_PROGRESS',
      completedAt: null,
    };

    const updated = [newTrip, ...closedOutTrips];
    set({ trips: updated });
    await persist(currentUserId, updated);
    return newTrip;
  },

  completeTrip: async (id) => {
    const { currentUserId, trips } = get();
    if (!currentUserId) return;
    const updated = trips.map((t) =>
      t.id === id
        ? { ...t, status: 'COMPLETED' as const, completedAt: new Date().toISOString() }
        : t
    );
    set({ trips: updated });
    await persist(currentUserId, updated);
  },

  cancelTrip: async (id) => {
    const { currentUserId, trips } = get();
    if (!currentUserId) return;
    const updated = trips.map((t) =>
      t.id === id
        ? { ...t, status: 'CANCELLED' as const, completedAt: new Date().toISOString() }
        : t
    );
    set({ trips: updated });
    await persist(currentUserId, updated);
  },

  deleteTrip: async (id) => {
    const { currentUserId, trips } = get();
    if (!currentUserId) return;
    const updated = trips.filter((t) => t.id !== id);
    set({ trips: updated });
    await persist(currentUserId, updated);
  },
}));
