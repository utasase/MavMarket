import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Animated } from "react-native";
import { MavLogo } from "./MavLogo";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameY = useRef(new Animated.Value(10)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const dotScales = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, damping: 15, stiffness: 150, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(nameOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(nameY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 300);

    setTimeout(() => {
      Animated.timing(dotsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
        dotScales.forEach((scale, i) => {
          Animated.loop(
            Animated.sequence([
              Animated.delay(i * 150),
              Animated.timing(scale, { toValue: 1.4, duration: 500, useNativeDriver: true }),
              Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
            ])
          ).start();
        });
      });
    }, 600);

    setTimeout(() => {
      Animated.timing(bottomOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 800);

    const timer = setTimeout(() => onComplete(), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <MavLogo size={96} />
      </Animated.View>

      <Animated.View style={[styles.nameContainer, { opacity: nameOpacity, transform: [{ translateY: nameY }] }]}>
        <Text style={styles.appName}>Mav Market</Text>
        <Text style={styles.subtitle}>UTA Student Marketplace</Text>
      </Animated.View>

      <Animated.View style={[styles.dotsContainer, { opacity: dotsOpacity }]}>
        <View style={styles.dots}>
          {dotScales.map((scale, i) => (
            <Animated.View key={i} style={[styles.dot, { transform: [{ scale }] }]} />
          ))}
        </View>
      </Animated.View>

      <Animated.View style={[styles.bottomTextWrapper, { opacity: bottomOpacity }]}>
        <Text style={styles.bottomText}>University of Texas at Arlington</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0064B1",
    alignItems: "center",
    justifyContent: "center",
    width,
    height,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  nameContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 24,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 4,
  },
  dotsContainer: {
    marginTop: 48,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  bottomTextWrapper: {
    position: "absolute",
    bottom: 40,
  },
  bottomText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
  },
});
