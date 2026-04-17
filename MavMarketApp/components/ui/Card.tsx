import React from "react";
import { View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { radius, spacing } from "../../lib/theme";

export type CardVariant = "surface" | "elevated" | "outline";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Card({
  variant = "surface",
  padding = "md",
  radius: r = radius.lg,
  style,
  children,
}: CardProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const bg =
    variant === "elevated"
      ? c.surfaceElevated
      : variant === "outline"
        ? "transparent"
        : c.surface;

  const elevation =
    variant === "elevated" ? theme.elevation.level2 : theme.elevation.level1;

  const padValue =
    padding === "none"
      ? 0
      : padding === "sm"
        ? spacing.sm
        : padding === "lg"
          ? spacing.xl
          : spacing.lg;

  return (
    <View
      style={[
        styles.base,
        elevation,
        {
          backgroundColor: bg,
          borderRadius: r,
          padding: padValue,
          borderColor: variant === "outline" ? c.border : elevation.borderColor,
          borderWidth:
            variant === "outline" ? 1 : (elevation.borderWidth as number) ?? 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
