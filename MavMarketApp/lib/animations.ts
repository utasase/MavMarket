import { Animated } from 'react-native';

export const springConfig = {
  bouncy: { damping: 12, stiffness: 200, useNativeDriver: true },
  smooth: { damping: 20, stiffness: 300, useNativeDriver: true },
  snappy: { damping: 15, stiffness: 400, useNativeDriver: true },
} as const;

export function createPressAnimation(scaleValue: Animated.Value, scaleTo = 0.95) {
  return {
    onPressIn: () => {
      Animated.spring(scaleValue, {
        toValue: scaleTo,
        ...springConfig.snappy,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        ...springConfig.bouncy,
      }).start();
    },
  };
}

export function fadeIn(value: Animated.Value, duration = 300) {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
}

export function slideUp(value: Animated.Value, fromY = 30, duration = 400) {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
}

export function staggeredFadeIn(
  items: Animated.Value[],
  delay = 50,
  duration = 250,
) {
  return Animated.stagger(
    delay,
    items.map((val) =>
      Animated.timing(val, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ),
  );
}
