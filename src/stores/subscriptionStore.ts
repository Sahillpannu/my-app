import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionPlan = 'MONTHLY' | 'YEARLY' | null;

interface SubscriptionStore {
  currentPlan: SubscriptionPlan;
  hydrated: boolean;
  currentUserId: string | null;
  hydrate: (userId: string) => Promise<void>;
  selectPlan: (plan: 'MONTHLY' | 'YEARLY') => Promise<void>;
  cancelPlan: () => Promise<void>;
}

const keyFor = (userId: string) => `truckio_subscription_${userId}`;

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  currentPlan: null,
  hydrated: false,
  currentUserId: null,

  hydrate: async (userId: string) => {
    if (!userId) return;
    try {
      const raw = await AsyncStorage.getItem(keyFor(userId));
      const currentPlan: SubscriptionPlan = raw ? JSON.parse(raw) : null;
      set({ currentPlan, hydrated: true, currentUserId: userId });
    } catch {
      set({ currentPlan: null, hydrated: true, currentUserId: userId });
    }
  },

  // NOTE: this is local state only — no payment is actually processed.
  // Wiring this to a real subscription provider (Stripe, RevenueCat, etc.)
  // is a separate, larger piece of work. This exists so the UI and the
  // rest of the app can react to "does this user have a plan selected"
  // without blocking on that integration being built first.
  selectPlan: async (plan) => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    set({ currentPlan: plan });
    await AsyncStorage.setItem(keyFor(currentUserId), JSON.stringify(plan));
  },

  cancelPlan: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    set({ currentPlan: null });
    await AsyncStorage.setItem(keyFor(currentUserId), JSON.stringify(null));
  },
}));
