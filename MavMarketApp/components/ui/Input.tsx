import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { radius, spacing } from "../../lib/theme";

export interface InputProps extends Omit<TextInputProps, "style"> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * A lightweight, label-less input used for search bars and chat composers
 * where `Field` (floating label) is overkill.
 */
export function Input({
  leftIcon,
  rightIcon,
  containerStyle,
  onFocus,
  onBlur,
  placeholder,
  ...rest
}: InputProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: c.surface,
          borderColor: focused ? c.accent500 : c.border,
          borderWidth: focused ? 2 : 1,
          paddingHorizontal: focused ? spacing.md - 1 : spacing.md,
        },
        containerStyle,
      ]}
    >
      {leftIcon ? <View style={styles.side}>{leftIcon}</View> : null}
      <TextInput
        {...rest}
        placeholder={placeholder}
        placeholderTextColor={c.textTertiary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            color: c.textPrimary,
            fontFamily: theme.typography.body.fontFamily,
          },
        ]}
      />
      {rightIcon ? <View style={styles.side}>{rightIcon}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.full,
    height: 44,
  },
  side: { alignItems: "center", justifyContent: "center" },
  input: { flex: 1, fontSize: 15 },
});
