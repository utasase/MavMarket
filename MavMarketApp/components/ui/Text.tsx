import React from "react";
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { type TypographyScale } from "../../lib/types";

export type TextVariant = keyof TypographyScale;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  weight?: TextStyle["fontWeight"];
  align?: TextStyle["textAlign"];
  style?: StyleProp<TextStyle>;
}

/**
 * Themed Text primitive. Always prefer this over `react-native` Text for any
 * screen content so the type scale stays consistent across the app.
 */
export function Text({
  variant = "body",
  color,
  weight,
  align,
  style,
  children,
  ...rest
}: TextProps) {
  const { theme } = useTheme();
  const t = theme.typography[variant];
  const c = theme.colors;

  return (
    <RNText
      {...rest}
      style={[
        {
          color: color ?? c.textPrimary,
          fontFamily: t.fontFamily,
          fontSize: t.fontSize,
          lineHeight: t.lineHeight,
          letterSpacing: t.letterSpacing,
          fontWeight: weight ?? t.fontWeight,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
