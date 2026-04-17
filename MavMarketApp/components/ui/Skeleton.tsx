import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { radius as r } from "../../lib/theme";

export interface SkeletonProps {
  width?: number | `${number}%` | "auto";
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 16,
  radius: rr = r.sm,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: theme.motion.shimmer,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim, theme.motion.shimmer]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-160, 320],
  });

  const baseBg = theme.dark ? "rgba(255,255,255,0.04)" : "rgba(16,24,40,0.05)";
  const stripeBg = theme.dark ? "rgba(255,255,255,0.08)" : "rgba(16,24,40,0.1)";

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: rr,
          backgroundColor: baseBg,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.stripe,
          {
            backgroundColor: stripeBg,
            transform: [{ translateX }, { skewX: "-20deg" }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 120,
    opacity: 0.6,
  },
});
