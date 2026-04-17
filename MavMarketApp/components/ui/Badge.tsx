import React from "react";
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { radius, spacing } from "../../lib/theme";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  size?: "sm" | "md";
}

export function Badge({ label, tone = "neutral", icon, style, size = "sm" }: BadgeProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const tones: Record<BadgeTone, { bg: string; fg: string }> = {
    neutral: { bg: c.surfaceOverlay, fg: c.textSecondary },
    accent: { bg: c.accentSurface, fg: c.accentLight },
    success: { bg: c.successSurface, fg: c.success },
    warning: { bg: c.warningSurface, fg: c.warning },
    danger: { bg: c.errorSurface, fg: c.error },
  };

  const t = tones[tone];
  const h = size === "md" ? 24 : 20;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: t.bg,
          height: h,
          paddingHorizontal: size === "md" ? spacing.md : spacing.sm,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={{
          color: t.fg,
          fontFamily: theme.typography.label.fontFamily,
          fontSize: size === "md" ? 12 : 11,
          fontWeight: "600",
          letterSpacing: 0.2,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
  },
});
