import React from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  type StyleProp,
  type ViewStyle,
  type ScrollViewProps,
  type RefreshControlProps,
} from "react-native";
import {
  useSafeAreaInsets,
  type EdgeInsets,
} from "react-native-safe-area-context";
import { useTheme } from "../../lib/ThemeContext";

export type ScreenEdge = "top" | "bottom" | "horizontal" | "all" | "none";

export interface ScreenProps {
  /** Which safe-area edges to pad. Default: all. */
  edges?: ScreenEdge[];
  scroll?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  scrollViewProps?: ScrollViewProps;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

function resolvePadding(edges: ScreenEdge[], insets: EdgeInsets) {
  const all = edges.includes("all");
  return {
    paddingTop: all || edges.includes("top") ? insets.top : 0,
    paddingBottom: all || edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: all || edges.includes("horizontal") ? insets.left : 0,
    paddingRight: all || edges.includes("horizontal") ? insets.right : 0,
  };
}

export function Screen({
  edges = ["top", "horizontal"],
  scroll = false,
  refreshControl,
  scrollViewProps,
  backgroundColor,
  style,
  contentStyle,
  children,
}: ScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const bg = backgroundColor ?? theme.colors.background;

  const padding = edges.includes("none") ? {} : resolvePadding(edges, insets);

  if (scroll) {
    return (
      <View style={[styles.root, { backgroundColor: bg }, style]}>
        <StatusBar
          barStyle={theme.dark ? "light-content" : "dark-content"}
          backgroundColor={bg}
        />
        <ScrollView
          {...scrollViewProps}
          style={{ flex: 1 }}
          contentContainerStyle={[padding, contentStyle]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg }, padding, style]}>
      <StatusBar
        barStyle={theme.dark ? "light-content" : "dark-content"}
        backgroundColor={bg}
      />
      <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
