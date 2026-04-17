import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../lib/ThemeContext";

export default function PaymentCancelScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.textPrimary }]}>Checkout canceled</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>
        No charge was made. You can start the purchase again anytime.
      </Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: c.accent }]}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.btnText}>Back to home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  title: { fontSize: 22, fontWeight: "600" },
  body: { fontSize: 14, textAlign: "center" },
  btn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
