import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";

export default function Index() {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return null;
  }

  if (user) {
    return <Redirect href={"/(main)/" as any} />;
  }

  return <Redirect href="/(auth)/login" />;
}