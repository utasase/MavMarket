import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Animated,
  StyleSheet,
  Pressable,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { radius, spacing } from "../../lib/theme";

export interface FieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  helper?: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Floating-label input. Keeps the label visible as the input gains value so
 * the form feels editorial rather than ghosty.
 */
export function Field({
  label,
  helper,
  error,
  leftIcon,
  rightAdornment,
  value,
  onFocus,
  onBlur,
  containerStyle,
  placeholder,
  ...rest
}: FieldProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: focused || (value && value.length > 0) ? 1 : 0,
      duration: theme.motion.fast,
      useNativeDriver: false,
    }).start();
  }, [focused, value, anim, theme.motion.fast]);

  const borderColor = error
    ? c.error
    : focused
      ? c.accent500
      : c.border;

  const labelTop = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 6],
  });
  const labelSize = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 11],
  });

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Pressable onPress={() => inputRef.current?.focus()}>
        <View
          style={[
            styles.box,
            {
              borderColor,
              backgroundColor: c.surface,
              borderWidth: focused ? 2 : 1,
              paddingHorizontal: focused ? spacing.lg - 1 : spacing.lg,
            },
          ]}
        >
          {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
          <View style={{ flex: 1 }}>
            <Animated.Text
              style={[
                styles.label,
                {
                  color: error ? c.error : focused ? c.accentLight : c.textSecondary,
                  fontFamily: theme.typography.label.fontFamily,
                  top: labelTop,
                  fontSize: labelSize,
                },
              ]}
              pointerEvents="none"
            >
              {label}
            </Animated.Text>
            <TextInput
              ref={inputRef}
              {...rest}
              value={value}
              placeholder={focused ? placeholder : undefined}
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
          </View>
          {rightAdornment}
        </View>
      </Pressable>
      {error ? (
        <Text
          style={[
            styles.helper,
            {
              color: c.error,
              fontFamily: theme.typography.caption.fontFamily,
            },
          ]}
        >
          {error}
        </Text>
      ) : helper ? (
        <Text
          style={[
            styles.helper,
            {
              color: c.textTertiary,
              fontFamily: theme.typography.caption.fontFamily,
            },
          ]}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  box: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  leftIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    position: "absolute",
    left: 0,
    letterSpacing: 0.1,
  },
  input: {
    fontSize: 15,
    paddingTop: 22,
    paddingBottom: 8,
    // Align baseline with floating label
    height: 56,
  },
  helper: {
    marginTop: 6,
    marginLeft: spacing.md,
    fontSize: 12,
  },
});
