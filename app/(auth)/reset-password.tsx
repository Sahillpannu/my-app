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

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { updatePassword, loading } = useAuthStore();

  const passwordsMatch = password === confirm;
  const isReady = password.length >= 6 && passwordsMatch;

  const handleReset = async () => {
    if (!isReady) return;
    setError(null);
    const { error } = await updatePassword(password);
    if (error) {
      setError(error);
    } else {
      setDone(true);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Background image */}
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

              {done ? (
                /* ── Success state ── */
                <View style={styles.successContainer}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>✅</Text>
                  </View>
                  <View style={styles.headerRow}>
                    <Text style={styles.title}>Password updated</Text>
                    <Text style={styles.subtitle}>
                      Your password has been changed successfully.{"\n"}You can now sign in with your new password.
                    </Text>
                  </View>
                  <Pressable
                    style={styles.cta}
                    onPress={() => router.replace("/(auth)/login")}
                  >
                    <Text style={styles.ctaText}>Sign In</Text>
                  </Pressable>
                </View>
              ) : (
                /* ── Input state ── */
                <>
                  <View style={styles.headerRow}>
                    <Text style={styles.title}>Set new password</Text>
                    <Text style={styles.subtitle}>
                      Choose a strong password for your account
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>NEW PASSWORD</Text>
                    <View style={styles.passwordWrapper}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        value={password}
                        onChangeText={(t) => { setPassword(t); setError(null); }}
                        placeholder="Min. 6 characters"
                        placeholderTextColor="#999"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
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

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>CONFIRM PASSWORD</Text>
                    <TextInput
                      style={[
                        styles.input,
                        confirm.length > 0 && !passwordsMatch
                          ? styles.inputError
                          : null,
                      ]}
                      value={confirm}
                      onChangeText={(t) => { setConfirm(t); setError(null); }}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {confirm.length > 0 && !passwordsMatch && (
                      <Text style={styles.matchHint}>Passwords don't match</Text>
                    )}
                  </View>

                  {error && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>⚠ {error}</Text>
                    </View>
                  )}

                  <Pressable
                    style={[
                      styles.cta,
                      (!isReady || loading) && styles.ctaDisabled,
                    ]}
                    disabled={!isReady || loading}
                    onPress={handleReset}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.ctaText}>Update Password</Text>
                    )}
                  </Pressable>
                </>
              )}

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

  // Success
  successContainer: { gap: 16, alignItems: "center" },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconText: { fontSize: 28 },

  headerRow: { gap: 4, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#1A1A1A", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#999", textAlign: "center", lineHeight: 20 },

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
  matchHint: { fontSize: 12, color: "#EF4444", marginTop: 2 },

  errorBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  errorText: { fontSize: 13, color: "#EF4444" },

  cta: {
    backgroundColor: "#404040",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    alignSelf: "stretch",
  },
  ctaDisabled: { opacity: 0.35 },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
});
