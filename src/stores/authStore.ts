import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/src/lib/supabase";

interface AuthStore {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  loading: boolean;
  initialize: () => void;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; needsVerification: boolean }>;
  verifyOtp: (
    email: string,
    token: string
  ) => Promise<{ error: string | null }>;
  resendOtp: (email: string) => Promise<{ error: string | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  initialized: false,
  loading: false,

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        initialized: true,
      });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
      });
    });
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    set({ loading: false });
    if (error) return { error: error.message };
    return { error: null };
  },

  signUpWithEmail: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // we use OTP not magic link
      },
    });
    set({ loading: false });
    if (error) return { error: error.message, needsVerification: false };
    // if user exists but not confirmed → needs OTP
    const needsVerification = !data.session;
    return { error: null, needsVerification };
  },

  verifyOtp: async (email, token) => {
    set({ loading: true });
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    set({ loading: false });
    if (error) return { error: error.message };
    return { error: null };
  },

  resendOtp: async (email) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  sendPasswordReset: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "exp://localhost:8081/--/(auth)/reset-password",
    });
    if (error) return { error: error.message };
    return { error: null };
  },

  updatePassword: async (newPassword) => {
    set({ loading: true });
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    set({ loading: false });
    if (error) return { error: error.message };
    return { error: null };
  },
}));
