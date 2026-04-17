import React, { useRef } from "react";
import {
  Pressable,
  Text,
  Animated,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { radius, spacing } from "../../lib/theme";

export interface ChipProps extends Omit<PressableProps, "style"> {
  label: string;
  selected?: boolean;
  leftIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  size?: "sm" | "md";
}

export function Chip({
  label,
  selected = false,
  leftIcon,
  size = "md",
  onPressIn,
  onPressOut,
  style,
  ...rest
}: ChipProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const scale = useRef(new Animated.Value(1)).current;

  const bg = selected ? (theme.dark ? c.accent100 : c.accent50) : c.surface;
  const fg = selected ? c.accentLight : c.textSecondary;
  const border = selected
    ? theme.dark
      ? c.accent200
      : c.accent100
    : c.border;

  const height = size === "sm" ? 30 : 36;
  const paddingH = size === "sm" ? spacing.md : spacing.lg;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPressIn={(e) => {
          Animated.spring(scale, {
            toValue: theme.motion.pressScale,
            speed: 60,
            bounciness: 0,
            useNativeDriver: true,
          }).start();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          Animated.spring(scale, {
            toValue: 1,
            speed: 30,
            bounciness: 6,
            useNativeDriver: true,
          }).start();
          onPressOut?.(e);
        }}
        style={[
          styles.chip,
          {
            height,
            paddingHorizontal: paddingH,
            backgroundColor: bg,
            borderColor: border,
          },
        ]}
        {...rest}
      >
        {leftIcon}
        <Text
          style={[
            styles.label,
            {
              color: fg,
              fontFamily: theme.typography.label.fontFamily,
              fontSize: size === "sm" ? 12 : 13,
              fontWeight: selected ? "600" : "500",
            },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  label: {
    letterSpacing: 0.1,
  },
});
