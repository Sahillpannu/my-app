import { useState, useRef } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/src/stores/authStore";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const OTP_LENGTH = 6;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const { verifyOtp, resendOtp, loading } = useAuthStore();

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    // auto-advance
    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    // auto-submit when all filled
    if (newOtp.every((d) => d !== "") && digit) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const token = code ?? otp.join("");
    if (token.length < OTP_LENGTH) return;
    setError(null);
    const { error } = await verifyOtp(email, token);
    if (error) {
      setError(error);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    }
    // on success → _layout.tsx auto-redirects
  };

  const handleResend = async () => {
    setError(null);
    setResent(false);
    const { error } = await resendOtp(email);
    if (error) {
      setError(error);
    } else {
      setResent(true);
    }
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

              <Pressable onPress={() => router.back()} style={styles.backRow}>
                <Text style={styles.backText}>← Back</Text>
              </Pressable>

              <View style={styles.headerRow}>
                <Text style={styles.title}>Verify your email</Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit code to{"\n"}
                  <Text style={styles.emailText}>{email}</Text>
                </Text>
              </View>

              <View style={styles.divider} />

              {/* OTP boxes */}
              <View style={styles.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => { inputs.current[i] = r; }}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      error ? styles.otpBoxError : null,
                    ]}
                    value={digit}
                    onChangeText={(t) => handleChange(t, i)}
                    onKeyPress={(e) => handleKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
              )}

              {resent && (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>
                    ✓ New code sent to {email}
                  </Text>
                </View>
              )}

              <Pressable
                style={[
                  styles.cta,
                  (otp.some((d) => !d) || loading) && styles.ctaDisabled,
                ]}
                disabled={otp.some((d) => !d) || loading}
                onPress={() => handleVerify()}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.ctaText}>Verify Email</Text>
                )}
              </Pressable>

              <View style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't get the code? </Text>
                <Pressable onPress={handleResend}>
                  <Text style={styles.resendLink}>Resend</Text>
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
  backRow: { marginBottom: 4 },
  backText: { fontSize: 14, color: "#666", fontWeight: "600" },
  headerRow: { gap: 6 },
  title: { fontSize: 24, fontWeight: "700", color: "#1A1A1A" },
  subtitle: { fontSize: 13, color: "#999", lineHeight: 20 },
  emailText: { fontWeight: "700", color: "#1A1A1A" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 4 },

  // OTP
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginVertical: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  otpBoxFilled: {
    borderColor: "#404040",
    backgroundColor: "#F5F5F5",
  },
  otpBoxError: {
    borderColor: "#EF4444",
    backgroundColor: "#FFF5F5",
  },

  errorBox: {
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  errorText: { fontSize: 13, color: "#EF4444" },
  successBox: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#22C55E",
  },
  successText: { fontSize: 13, color: "#16A34A" },

  cta: {
    backgroundColor: "#404040",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  ctaDisabled: { opacity: 0.35 },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: 4 },
  resendText: { fontSize: 13, color: "#999" },
  resendLink: { fontSize: 13, color: "#404040", fontWeight: "700" },
});
