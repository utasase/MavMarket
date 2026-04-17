import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { XCircle } from "lucide-react-native";
import { useTheme } from "../lib/ThemeContext";
import { Button } from "../components/ui/Button";
import { spacing } from "../lib/theme";

export default function PaymentCancelScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.inner}>
        <View
          style={[
            styles.iconRing,
            { borderColor: c.textTertiary, backgroundColor: c.surfaceElevated },
          ]}
        >
          <XCircle size={56} color={c.textSecondary} strokeWidth={1.6} />
        </View>
        <Text
          style={[
            styles.title,
            {
              color: c.textPrimary,
              fontFamily: theme.typography.title.fontFamily,
            },
          ]}
        >
          Checkout canceled
        </Text>
        <Text style={[styles.body, { color: c.textSecondary }]}>
          No charge was made. You can start the purchase again anytime.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          label="Back to home"
          variant="primary"
          onPress={() => router.replace("/")}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  footer: {
    paddingTop: spacing.md,
  },
});
