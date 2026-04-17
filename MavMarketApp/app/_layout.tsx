import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Auth0Provider } from "react-native-auth0";
import { SplashScreen } from "../components/SplashScreen";
import { LoginPage } from "../components/LoginPage";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import { MavLogo } from "../components/MavLogo";

function EmailConfirmedScreen({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;

  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View style={[styles.confirmedScreen, { backgroundColor: c.background }]}>
      <View style={[styles.confirmedLogoBox, { shadowColor: c.shadow }]}>
        <MavLogo size={64} />
      </View>
      <Text style={[styles.confirmedTitle, { color: c.textPrimary }]}>Email confirmed!</Text>
      <Text style={[styles.confirmedSubtitle, { color: c.textSecondary }]}>Welcome to Mav Market.</Text>
    </View>
  );
}

function AppGate() {
  const { session, loading, confirmed, clearConfirmed } = useAuth();
  const { theme, isDark } = useTheme();
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

  return (
    <>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <Auth0Provider
      domain={process.env.EXPO_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!}
    >
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedRoot />
        </ThemeProvider>
      </SafeAreaProvider>
    </Auth0Provider>
  );
}

function ThemedRoot() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confirmedScreen: {
    flex: 1,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmedTitle: {
    fontSize: 24,
    textAlign: "center",
  },
  confirmedSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
