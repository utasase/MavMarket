import React, { useRef } from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Animated,
  ActivityIndicator,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { radius, spacing } from "../../lib/theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  fullWidth,
  disabled,
  onPressIn,
  onPressOut,
  style,
  labelStyle,
  ...rest
}: ButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const scale = useRef(new Animated.Value(1)).current;

  const heights: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 52 };
  const paddings: Record<ButtonSize, number> = {
    sm: spacing.md,
    md: spacing.lg,
    lg: spacing.xl,
  };
  const fontSize: Record<ButtonSize, number> = { sm: 13, md: 15, lg: 16 };

  const bg =
    variant === "primary"
      ? c.accent500
      : variant === "danger"
        ? c.error
        : variant === "secondary"
          ? c.surfaceElevated
          : "transparent";

  const fg =
    variant === "primary" || variant === "danger"
      ? "#FFFFFF"
      : variant === "secondary"
        ? c.textPrimary
        : c.accentLight;

  const border =
    variant === "secondary"
      ? { borderWidth: 1, borderColor: c.border }
      : variant === "ghost"
        ? { borderWidth: 0 }
        : { borderWidth: 0 };

  const opacity = disabled || loading ? 0.5 : 1;

  const handleIn = (e: any) => {
    Animated.spring(scale, {
      toValue: theme.motion.pressScale,
      speed: 60,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
    onPressIn?.(e);
  };
  const handleOut = (e: any) => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 30,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth ? { width: "100%" } : null,
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled, busy: !!loading }}
        disabled={disabled || loading}
        onPressIn={handleIn}
        onPressOut={handleOut}
        style={[
          styles.base,
          {
            height: heights[size],
            paddingHorizontal: paddings[size],
            backgroundColor: bg,
            opacity,
          },
          border,
        ]}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={styles.content}>
            {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
            <Text
              style={[
                {
                  color: fg,
                  fontSize: fontSize[size],
                  fontFamily: theme.typography.bodyStrong.fontFamily,
                  fontWeight: "600",
                  letterSpacing: 0.1,
                },
                labelStyle,
              ]}
            >
              {label}
            </Text>
            {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconSlot: {
    alignItems: "center",
    justifyContent: "center",
  },
});
