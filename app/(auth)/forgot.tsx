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

export default function ForgotScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const { sendPasswordReset, loading } = useAuthStore();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSend = async () => {
    if (!isValidEmail) return;
    setError(null);
    const { error } = await sendPasswordReset(email);
    if (error) {
      setError(error);
    } else {
      setSent(true);
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

              <Pressable onPress={() => router.back()} style={styles.backRow}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>

              {sent ? (
                /* ── Success state ── */
                <View style={styles.successContainer}>
                  <View style={styles.iconCircle}>
                    <Text style={styles.iconText}>✉️</Text>
                  </View>
                  <View style={styles.headerRow}>
                    <Text style={styles.title}>Check your inbox</Text>
                    <Text style={styles.subtitle}>
                      We sent a password reset link to{"\n"}
                      <Text style={styles.emailHighlight}>{email}</Text>
                    </Text>
                  </View>

                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      Click the link in the email to set a new password. The link expires in 1 hour.
                    </Text>
                  </View>

                  <Pressable
                    style={styles.cta}
                    onPress={() => router.replace("/(auth)/login")}
                  >
                    <Text style={styles.ctaText}>Back to Sign In</Text>
                  </Pressable>

                  <Pressable
                    style={styles.resendRow}
                    onPress={() => { setSent(false); setEmail(""); }}
                  >
                    <Text style={styles.resendText}>
                      Wrong email?{" "}
                      <Text style={styles.resendLink}>Try again</Text>
                    </Text>
                  </Pressable>
                </View>
              ) : (
                /* ── Input state ── */
                <>
                  <View style={styles.headerRow}>
                    <Text style={styles.title}>Forgot password?</Text>
                    <Text style={styles.subtitle}>
                      Enter your email and we'll send you a reset link
                    </Text>
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
                      autoFocus
                    />
                  </View>

                  {error && (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>⚠ {error}</Text>
                    </View>
                  )}

                  <Pressable
                    style={[
                      styles.cta,
                      (!isValidEmail || loading) && styles.ctaDisabled,
                    ]}
                    disabled={!isValidEmail || loading}
                    onPress={handleSend}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.ctaText}>Send Reset Link</Text>
                    )}
                  </Pressable>

                  <View style={styles.loginRow}>
                    <Text style={styles.loginText}>Remember it? </Text>
                    <Pressable onPress={() => router.replace("/(auth)/login")}>
                      <Text style={styles.loginLink}>Sign in</Text>
                    </Pressable>
                  </View>
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
  backRow: { marginBottom: 4 },
  backText: { fontSize: 14, color: "#666", fontWeight: "600" },

  // Success
  successContainer: { gap: 14, alignItems: "center" },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconText: { fontSize: 28 },

  headerRow: { gap: 4, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#1A1A1A", textAlign: "center" },
  subtitle: { fontSize: 13, color: "#999", textAlign: "center", lineHeight: 20 },
  emailHighlight: { fontWeight: "700", color: "#1A1A1A" },

  infoBox: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#D0D0D0",
    alignSelf: "stretch",
  },
  infoText: { fontSize: 13, color: "#666", lineHeight: 20 },

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

  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 4 },
  loginText: { fontSize: 13, color: "#999" },
  loginLink: { fontSize: 13, color: "#404040", fontWeight: "700" },

  resendRow: { marginTop: 4 },
  resendText: { fontSize: 13, color: "#999", textAlign: "center" },
  resendLink: { color: "#404040", fontWeight: "700" },
});
