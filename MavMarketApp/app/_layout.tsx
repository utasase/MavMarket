import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SplashScreen } from "../components/SplashScreen";
import { LoginPage } from "../components/LoginPage";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { MavLogo } from "../components/MavLogo";

function EmailConfirmedScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View style={styles.confirmedScreen}>
      <View style={styles.confirmedLogoBox}>
        <MavLogo size={64} />
      </View>
      <Text style={styles.confirmedTitle}>Email confirmed!</Text>
      <Text style={styles.confirmedSubtitle}>Welcome to Mav Market.</Text>
    </View>
  );
}

function AppGate() {
  const { session, loading, confirmed, clearConfirmed } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  if (loading) return null;

  if (confirmed && session) {
    return <EmailConfirmedScreen onDone={clearConfirmed} />;
  }

  if (!session) {
    return <LoginPage />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <AuthProvider>
          <AppGate />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  confirmedScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  confirmedLogoBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmedTitle: {
    fontSize: 24,
    color: "#111827",
    textAlign: "center",
  },
  confirmedSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});
