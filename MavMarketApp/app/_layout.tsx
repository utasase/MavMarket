import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SplashScreen } from "../components/SplashScreen";
import { LoginPage } from "../components/LoginPage";
import { AuthProvider, useAuth } from "../lib/auth-context";

function AppGate() {
  const { session, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onComplete={() => setSplashDone(true)} />;
  }

  // Still resolving session (very brief after splash)
  if (loading) return null;

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
});
