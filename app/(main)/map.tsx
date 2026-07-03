import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuthStore } from "@/src/stores/authStore";

export default function MapScreen() {
  const { user, signOut } = useAuthStore();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚛 Truckio</Text>
      <Text style={styles.sub}>Logged in as {user?.email}</Text>
      <Pressable style={styles.btn} onPress={signOut}>
        <Text style={styles.btnText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F1117",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: { fontSize: 32, color: "#FFF", fontWeight: "700" },
  sub: { fontSize: 14, color: "#999" },
  btn: {
    backgroundColor: "#404040",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: { color: "#FFF", fontWeight: "600" },
});
