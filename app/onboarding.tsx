import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Pressable,
  Keyboard,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";

const BRAND_COLOR = "#0a7ea4";
const BRAND_COLOR_DISABLED = "#9BA1A6";
const BUTTON_DISABLED_BG = "#d1d5db";

function formatPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function OnboardingScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);

  const rawDigits = phoneNumber.replace(/\D/g, "");
  const isValid = rawDigits.length === 10;
  const isButtonEnabled = isValid && isAgreed;

  const handlePhoneChange = useCallback((text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  }, []);

  const handleToggleAgreed = useCallback(() => {
    setIsAgreed((prev) => !prev);
  }, []);

  const handleGetStarted = useCallback(async () => {
    if (!isButtonEnabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/");
  }, [isButtonEnabled]);

  const openTerms = useCallback(() => {
    WebBrowser.openBrowserAsync("https://example.com/terms");
  }, []);

  const openPrivacy = useCallback(() => {
    WebBrowser.openBrowserAsync("https://example.com/privacy");
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.keyboardAvoid} onPress={dismissKeyboard}>
          <LinearGradient
            colors={["#f0f0f0", "#4a4a4a"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.card}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="YOUR MOBILE NUMBER"
                  placeholderTextColor="#9BA1A6"
                  keyboardType="number-pad"
                  maxLength={14}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  returnKeyType="done"
                />

                <Pressable
                  style={styles.checkboxRow}
                  onPress={handleToggleAgreed}
                >
                  <View
                    style={[
                      styles.checkbox,
                      isAgreed && styles.checkboxChecked,
                    ]}
                  >
                    {isAgreed && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    I agree to be contacted about{" "}
                    <Text style={styles.link} onPress={openTerms}>
                      route updates
                    </Text>{" "}
                    &{" "}
                    <Text style={styles.link} onPress={openPrivacy}>
                      terms & privacy policy
                    </Text>
                  </Text>
                </Pressable>

                <TouchableOpacity
                  style={[
                    styles.button,
                    isButtonEnabled
                      ? styles.buttonEnabled
                      : styles.buttonDisabled,
                  ]}
                  onPress={handleGetStarted}
                  disabled={!isButtonEnabled}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isButtonEnabled
                        ? styles.buttonTextEnabled
                        : styles.buttonTextDisabled,
                    ]}
                  >
                    GET STARTED
                  </Text>
                </TouchableOpacity>

                <Text style={styles.finePrint}>
                  By proceeding you agree to our{" "}
                  <Text style={styles.finePrintLink} onPress={openTerms}>
                    terms of use
                  </Text>{" "}
                  &{" "}
                  <Text style={styles.finePrintLink} onPress={openPrivacy}>
                    privacy policy
                  </Text>
                </Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingBottom: 64,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    marginHorizontal: 24,
    paddingHorizontal: 32,
    paddingVertical: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    letterSpacing: 1,
    color: "#11181C",
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#9BA1A6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLOR,
    borderColor: BRAND_COLOR,
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: 16,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: "#11181C",
    lineHeight: 20,
  },
  link: {
    color: BRAND_COLOR,
    textDecorationLine: "underline",
  },
  button: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonEnabled: {
    backgroundColor: BRAND_COLOR,
  },
  buttonDisabled: {
    backgroundColor: BUTTON_DISABLED_BG,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  buttonTextEnabled: {
    color: "#ffffff",
  },
  buttonTextDisabled: {
    color: "#9BA1A6",
  },
  finePrint: {
    fontSize: 12,
    color: "#9BA1A6",
    textAlign: "center",
    lineHeight: 18,
  },
  finePrintLink: {
    color: BRAND_COLOR,
    textDecorationLine: "underline",
  },
});
