import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { SplashScreen } from "../components/SplashScreen";
import { LoginPage } from "../components/LoginPage";
import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import { MavLogo } from "../components/MavLogo";
import type { AuthContextType } from "../lib/types";

// In Expo Go the native `react-native-auth0` module is unavailable, so we load
// the expo-auth-session based provider instead. Dev-client / production builds
// get the native Auth0Provider + useAuth0 path. We check both fields because
// `appOwnership` is deprecated in favor of `executionEnvironment` in newer SDKs.
const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === "storeClient";

type AuthModule = {
  AuthProvider: React.ComponentType<{ children: React.ReactNode }>;
  useAuth: () => AuthContextType;
};

const { AuthProvider, useAuth }: AuthModule = isExpoGo
  ? require("../lib/auth-context.expo")
  : require("../lib/auth-context");

const Auth0Provider: React.ComponentType<any> = isExpoGo
  ? ({ children }: { children: React.ReactNode }) => <>{children}</>
  : require("react-native-auth0").Auth0Provider;

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
  const { session, loading, justCompletedEmailConfirmation, clearConfirmed } = useAuth();
  const { theme, isDark } = useTheme();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  if (loading) return null;

  if (justCompletedEmailConfirmation && session) {
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
          <AuthProvider>
            <ThemedRoot />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Auth0Provider>
  );
}

function ThemedRoot() {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppGate />
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
