import React from "react";
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { radius, spacing } from "../../lib/theme";
import { Button, type ButtonProps } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  ctaVariant?: ButtonProps["variant"];
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
  ctaVariant = "primary",
  style,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.wrap, style]}>
      {icon ? (
        <View
          style={[
            styles.iconFrame,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
            },
          ]}
        >
          {icon}
        </View>
      ) : null}
      <Text
        style={[
          {
            color: c.textPrimary,
            fontFamily: theme.typography.headline.fontFamily,
            fontSize: theme.typography.headline.fontSize,
            lineHeight: theme.typography.headline.lineHeight,
            letterSpacing: theme.typography.headline.letterSpacing,
            fontWeight: theme.typography.headline.fontWeight,
            textAlign: "center",
          },
        ]}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            {
              color: c.textSecondary,
              fontFamily: theme.typography.body.fontFamily,
              fontSize: theme.typography.body.fontSize,
              lineHeight: theme.typography.body.lineHeight,
              textAlign: "center",
              maxWidth: 320,
            },
          ]}
        >
          {description}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <Button label={ctaLabel} onPress={onCta} variant={ctaVariant} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconFrame: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
});
