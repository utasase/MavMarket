import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../lib/ThemeContext";

/**
 * Shared backdrop used by SplashScreen and LoginPage. A soft blue radial glow
 * at the top-right gives both screens the same sense of place, so transitioning
 * from splash to login feels like one continuous surface rather than a cut.
 */
export function AuthBackground() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width, height } = Dimensions.get("window");

  const glowSize = Math.max(width, height) * 0.9;
  const accentRing = theme.dark
    ? "rgba(26,140,255,0.22)"
    : "rgba(0,100,177,0.14)";
  const accentSoft = theme.dark
    ? "rgba(26,140,255,0.06)"
    : "rgba(0,100,177,0.04)";

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: c.background }]}
    >
      <LinearGradient
        colors={[accentRing, accentSoft, "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.9 }}
        style={[
          StyleSheet.absoluteFill,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            position: "absolute",
            right: -glowSize * 0.35,
            top: -glowSize * 0.35,
            opacity: theme.dark ? 1 : 0.9,
          },
        ]}
      />
      <LinearGradient
        colors={["transparent", theme.dark ? "#0A0A0B" : "#FFFFFF"]}
        locations={[0, 1]}
        style={[
          StyleSheet.absoluteFill,
          { top: height * 0.45 },
        ]}
      />
    </View>
  );
}
