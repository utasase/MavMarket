import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../../lib/ThemeContext";
import { radius } from "../../lib/theme";

export interface AvatarProps {
  source?: ImageSourcePropType | string | null;
  name?: string;
  size?: number;
  online?: boolean;
  verified?: boolean;
  style?: StyleProp<ViewStyle>;
}

function initialsOf(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase() || name.slice(0, 1).toUpperCase();
}

export function Avatar({
  source,
  name,
  size = 40,
  online,
  verified,
  style,
}: AvatarProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const src: ImageSourcePropType | null =
    typeof source === "string"
      ? source
        ? { uri: source }
        : null
      : source ?? null;

  const dotSize = Math.max(8, Math.round(size * 0.26));
  const verifiedSize = Math.max(12, Math.round(size * 0.34));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.frame,
          {
            width: size,
            height: size,
            borderRadius: radius.full,
            backgroundColor: c.surface,
            borderColor: verified ? c.accent500 : c.border,
            borderWidth: verified ? 2 : 1,
          },
        ]}
      >
        {src ? (
          <Image source={src} style={styles.image} />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                color: c.textSecondary,
                fontFamily: theme.typography.bodyStrong.fontFamily,
                fontSize: Math.round(size * 0.38),
                fontWeight: "600",
              },
            ]}
          >
            {initialsOf(name)}
          </Text>
        )}
      </View>
      {online ? (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: c.success,
              borderColor: c.background,
            },
          ]}
        />
      ) : null}
      {verified ? (
        <View
          style={[
            styles.verified,
            {
              width: verifiedSize,
              height: verifiedSize,
              borderRadius: verifiedSize / 2,
              backgroundColor: c.accent500,
              borderColor: c.background,
            },
          ]}
        >
          <Text style={styles.verifiedTick}>{String.fromCharCode(10003)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  initials: { includeFontPadding: false },
  dot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    borderWidth: 2,
  },
  verified: {
    position: "absolute",
    right: -2,
    top: -2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedTick: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
});
