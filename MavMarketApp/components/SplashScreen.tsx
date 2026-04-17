import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { MavLogo } from "./MavLogo";
import { useTheme } from "../lib/ThemeContext";
import { AuthBackground } from "./ui/AuthBackground";
import { spacing, radius } from "../lib/theme";

interface SplashScreenProps {
  onComplete: () => void;
}

/**
 * Splash sits on top of AuthBackground — the same background LoginPage uses —
 * so splash → login feels like one continuous surface rather than a cut.
 * No loading dots. Total animation ~1.6s.
 */
export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const logoScale = useRef(new Animated.Value(0.86)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkY = useRef(new Animated.Value(8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 14,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();

    const wordmarkTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(wordmarkOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkY, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ]).start();
    }, 320);

    const taglineTimer = setTimeout(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }).start();
    }, 680);

    const done = setTimeout(onComplete, 1600);
    return () => {
      clearTimeout(wordmarkTimer);
      clearTimeout(taglineTimer);
      clearTimeout(done);
    };
  }, [onComplete, logoScale, logoOpacity, wordmarkOpacity, wordmarkY, taglineOpacity]);

  const t = theme.typography;

  return (
    <View style={styles.root}>
      <AuthBackground />
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoFrame,
            theme.elevation.level3,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <MavLogo size={88} />
        </Animated.View>

        <Animated.View
          style={{
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkY }],
            alignItems: "center",
            marginTop: spacing.xl,
          }}
        >
          <Text
            style={{
              color: c.textPrimary,
              fontFamily: t.title.fontFamily,
              fontSize: 28,
              lineHeight: 34,
              letterSpacing: -0.4,
              fontWeight: "700",
            }}
          >
            Mav Market
          </Text>
        </Animated.View>
      </View>

      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            color: c.textTertiary,
            fontFamily: t.label.fontFamily,
            fontSize: t.label.fontSize,
            letterSpacing: 0.8,
          },
        ]}
      >
        UNIVERSITY OF TEXAS AT ARLINGTON
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoFrame: {
    width: 88,
    height: 88,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  tagline: {
    position: "absolute",
    bottom: 48,
  },
});
