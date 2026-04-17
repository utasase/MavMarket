import React, { useRef } from "react";
import {
  Pressable,
  View,
  Text,
  Animated,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { radius, spacing } from "../../lib/theme";

export type IconButtonVariant = "plain" | "surface" | "accent";
export type IconButtonSize = 36 | 40 | 44 | 48;

export interface IconButtonProps extends Omit<PressableProps, "style"> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  badgeCount?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}

export function IconButton({
  icon,
  variant = "plain",
  size = 44,
  badgeCount,
  disabled,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: IconButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const scale = useRef(new Animated.Value(1)).current;

  const bg =
    variant === "surface"
      ? c.surfaceElevated
      : variant === "accent"
        ? c.accentSurface
        : "transparent";
  const borderColor = variant === "surface" ? c.border : "transparent";

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
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
          styles.btn,
          {
            width: size,
            height: size,
            borderRadius: radius.full,
            backgroundColor: bg,
            borderColor,
            borderWidth: variant === "surface" ? 1 : 0,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        {...rest}
      >
        {icon}
        {typeof badgeCount === "number" && badgeCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: c.accent500 }]}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? "99+" : String(badgeCount)}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
