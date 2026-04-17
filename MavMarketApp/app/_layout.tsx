import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SplashScreen } from "../components/SplashScreen";
import { LoginPage } from "../components/LoginPage";
import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import { FontProvider, useFontsLoaded } from "../lib/FontContext";
import { MavLogo } from "../components/MavLogo";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { SavedProvider } from "../lib/SavedContext";

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
      <Text
        style={[
          styles.confirmedTitle,
          {
            color: c.textPrimary,
            fontFamily: theme.typography.title.fontFamily,
          },
        ]}
      >
        Email confirmed
      </Text>
      <Text
        style={[
          styles.confirmedSubtitle,
          {
            color: c.textSecondary,
            fontFamily: theme.typography.body.fontFamily,
          },
        ]}
      >
        Welcome to Mav Market.
      </Text>
    </View>
  );
}

function AppGate() {
  const { session, initializing, justCompletedEmailConfirmation, clearConfirmed } = useAuth();
  const { isDark } = useTheme();
  const fontsLoaded = useFontsLoaded();
  const [splashDone, setSplashDone] = useState(false);

  // Hold the splash until fonts are also loaded so the type system is live
  // on first paint of the Login screen.
  if (!splashDone || !fontsLoaded) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  if (initializing) return null;

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
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <FontProvider>
          <ThemeProvider>
            <AuthProvider>
              <SavedProvider>
                <ThemedRoot />
              </SavedProvider>
            </AuthProvider>
          </ThemeProvider>
        </FontProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
