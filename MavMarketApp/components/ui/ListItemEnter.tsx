import React, { useEffect, useRef } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../lib/ThemeContext";

export interface ListItemEnterProps {
  index?: number;
  delayBase?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Wraps list children with a fade + translate-up entrance. Cheaper than
 * Reanimated entering animations for long FlatLists and still feels deliberate.
 */
export function ListItemEnter({
  index = 0,
  delayBase,
  style,
  children,
}: ListItemEnterProps) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const delay = index * (delayBase ?? theme.motion.listStagger);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: theme.motion.base,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: theme.motion.base,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, index, delayBase, theme.motion]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
