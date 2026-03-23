import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SplashScreen } from "../components/SplashScreen";
import { LoginPage } from "../components/LoginPage";

type AppState = "splash" | "login" | "app";

export default function RootLayout() {
  const [appState, setAppState] = useState<AppState>("splash");

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {appState === "splash" && (
          <SplashScreen onComplete={() => setAppState("login")} />
        )}
        {appState === "login" && (
          <LoginPage onLogin={() => setAppState("app")} />
        )}
        {appState === "app" && <Slot />}
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
