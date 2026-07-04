import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";
import { supabase } from "@/src/lib/supabase";

export default function RootLayout() {
  const { user, initialized, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();

    // Handle password recovery deep link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/(auth)/reset-password");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuth = segments[0] === "(auth)";
    const onResetScreen = segments[1] === "reset-password";

    // Don't redirect away from the reset-password screen even if user session exists
    if (onResetScreen) return;

    if (!user && !inAuth) {
      router.replace("/(auth)/login");
    } else if (user && inAuth) {
      router.replace("/(main)/" as any);
    }
  }, [user, initialized, segments]);

  if (!initialized) return null;

  return <Slot />;
}
