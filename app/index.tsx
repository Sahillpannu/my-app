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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function Index() {
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[StyleSheet.absoluteFillObject, { overflow: "hidden" }]}>
        <Image
          source={require("../assets/images/truck-bg.jpeg")}
          resizeMode="cover"
          style={{
            position: "absolute",
            width: "100%",
            height: SCREEN_HEIGHT * 1.6,
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
              <Text style={styles.title}>Welcome</Text>
              

              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="YOUR MOBILE NUMBER"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />

              <Pressable
                style={styles.consentRow}
                onPress={() => setConsent(!consent)}
              >
                <View
                  style={[
                    styles.checkbox,
                    consent && styles.checkboxChecked,
                  ]}
                >
                  {consent && <Text style={styles.checkmark}>✓</Text>}
                </View>
               <Text style={styles.consentText}>
  I agree to receive SMS updates & calls from{" "}
  <Text style={styles.consentBold}>Truck App</Text> about
  early access, new features, service updates, and support.
</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.cta,
                  (!phone || !consent) && styles.ctaDisabled,
                ]}
                disabled={!phone || !consent}
              >
                <Text style={styles.ctaText}>Login</Text>
              </Pressable>
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
  wrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "90%",
    maxWidth: 420,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: "#D6D6D6",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    letterSpacing: 1,
    color: "#1A1A1A",
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#D6D6D6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#404040",
    borderColor: "#404040",
  },
  checkmark: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    color: "#999",
    lineHeight: 18,
  },
  consentBold: {
    fontWeight: "600",
    color: "#666",
  },
  cta: {
    backgroundColor: "#404040",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

