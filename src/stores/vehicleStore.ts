import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { VehicleProfile } from '@/src/types/vehicle';

interface VehicleStore {
  profiles: VehicleProfile[];
  activeProfileId: string | null;
  hydrated: boolean;
  currentUserId: string | null;
  hydrate: (userId: string) => Promise<void>;
  addProfile: (data: Omit<VehicleProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProfile: (id: string, updates: Partial<Omit<VehicleProfile, 'id' | 'createdAt'>>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  setActiveProfile: (id: string) => Promise<void>;
  getActiveProfile: () => VehicleProfile | null;
}

const keyFor = (userId: string) => `truckio_vehicles_${userId}`;

const persist = async (
  userId: string,
  profiles: VehicleProfile[],
  activeProfileId: string | null
) => {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify({ profiles, activeProfileId }));
};

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  hydrated: false,
  currentUserId: null,

  hydrate: async (userId: string) => {
    if (!userId) return;
    try {
      const raw = await AsyncStorage.getItem(keyFor(userId));
      if (raw) {
        const { profiles, activeProfileId } = JSON.parse(raw);
        set({ profiles, activeProfileId, hydrated: true, currentUserId: userId });
      } else {
        set({ profiles: [], activeProfileId: null, hydrated: true, currentUserId: userId });
      }
    } catch {
      set({ profiles: [], activeProfileId: null, hydrated: true, currentUserId: userId });
    }
  },

  addProfile: async (data) => {
    const { currentUserId, profiles, activeProfileId } = get();
    if (!currentUserId) return;
    const now = new Date().toISOString();
    const profile: VehicleProfile = {
      ...data,
      id: uuid.v4() as string,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...profiles, profile];
    const newActiveId = activeProfileId ?? profile.id;
    set({ profiles: updated, activeProfileId: newActiveId });
    await persist(currentUserId, updated, newActiveId);
  },

  updateProfile: async (id, updates) => {
    const { currentUserId, profiles, activeProfileId } = get();
    if (!currentUserId) return;
    const updated = profiles.map((p) =>
      p.id === id
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    );
    set({ profiles: updated });
    await persist(currentUserId, updated, activeProfileId);
  },

  deleteProfile: async (id) => {
    const { currentUserId, profiles, activeProfileId } = get();
    if (!currentUserId) return;
    const updated = profiles.filter((p) => p.id !== id);
    const newActiveId = activeProfileId === id ? (updated[0]?.id ?? null) : activeProfileId;
    set({ profiles: updated, activeProfileId: newActiveId });
    await persist(currentUserId, updated, newActiveId);
  },

  setActiveProfile: async (id) => {
    const { currentUserId, profiles } = get();
    if (!currentUserId) return;
    set({ activeProfileId: id });
    await persist(currentUserId, profiles, id);
  },

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get();
    return profiles.find((p) => p.id === activeProfileId) ?? null;
  },
}));
