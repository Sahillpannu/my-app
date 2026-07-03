import { useState } from "react";
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signInWithEmail, loading } = useAuthStore();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isReady = isValidEmail && password.length >= 6;

  const handleLogin = async () => {
    if (!isReady) return;
    setError(null);
    const { error } = await signInWithEmail(email, password);
    if (error) setError(error);
    // on success → _layout.tsx auto-redirects to /(main)/map
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[StyleSheet.absoluteFillObject, { overflow: "hidden" }]}>
        <Image
          source={require("../../assets/images/truck-bg.jpeg")}
          resizeMode="cover"
          style={{
            position: "absolute",
            width: "100%",
            height: SCREEN_HEIGHT * 1.1,
            top: -SCREEN_HEIGHT * 0.3,
          }}
        />
      </View>

      <LinearGradient
        colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <View style={styles.wrapper}>
            <View style={styles.card}>

              <View style={styles.headerRow}>
                <Text style={styles.title}>Welcome back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <TextInput
                  style={[styles.input, error ? styles.inputError : null]}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  placeholder="you@example.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      error ? styles.inputError : null,
                    ]}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(null); }}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={styles.eyeText}>
                      {showPassword ? "🙈" : "👁"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
              )}

              <Pressable
                style={styles.forgotRow}
                onPress={() => router.push("/(auth)/forgot" as any)}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

              <Pressable
                style={[styles.cta, (!isReady || loading) && styles.ctaDisabled]}
                disabled={!isReady || loading}
                onPress={handleLogin}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.ctaText}>Sign In</Text>
                )}
              </Pressable>

              <View style={styles.registerRow}>
                <Text style={styles.registerText}>
                  Don't have an account?{" "}
                </Text>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Text style={styles.registerLink}>Create one</Text>
                </Pressable>
              </View>

            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  wrapper: { flex: 1, justifyContent: "flex-end" },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: "100%",
    padding: 28,
    paddingBottom: 48,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: { gap: 4 },
  title: { fontSize: 24, fontWeight: "700", color: "#1A1A1A" },
  subtitle: { fontSize: 13, color: "#999" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 4 },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#999",
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  inputError: { borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
  passwordWrapper: { position: "relative" },
  passwordInput: { paddingRight: 48 },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  eyeText: { fontSize: 16 },
  errorBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  errorText: { fontSize: 13, color: "#EF4444" },
  forgotRow: { alignSelf: "flex-end", marginTop: -4 },
  forgotText: { fontSize: 12, color: "#666", fontWeight: "600" },
  cta: {
    backgroundColor: "#404040",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  ctaDisabled: { opacity: 0.35 },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: 4 },
  registerText: { fontSize: 13, color: "#999" },
  registerLink: { fontSize: 13, color: "#404040", fontWeight: "700" },
});
