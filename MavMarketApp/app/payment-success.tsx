import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/ThemeContext";

type Status = "checking" | "completed" | "pending" | "error";

export default function PaymentSuccessScreen() {
  const params = useLocalSearchParams<{ session_id?: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const sessionId = params.session_id;
    if (!sessionId) {
      setStatus("error");
      setMessage("Missing checkout session id.");
      return;
    }

    let cancelled = false;
    let hardTimeout: ReturnType<typeof setTimeout> | null = null;

    // 1. Immediate check — webhook may already have landed.
    // 2. Realtime subscription — react the instant the row flips.
    // 3. 45s hard timeout — fall back to "pending" UX.
    const channel = supabase
      .channel(`payment-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `stripe_checkout_session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string })?.status;
          if (newStatus === "completed" && !cancelled) setStatus("completed");
          if (newStatus === "failed" && !cancelled) {
            setStatus("error");
            setMessage("Payment failed. No charge was made.");
          }
        }
      )
      .subscribe();

    (async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("status")
        .eq("stripe_checkout_session_id", sessionId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      if (data?.status === "completed") setStatus("completed");
      if (data?.status === "failed") {
        setStatus("error");
        setMessage("Payment failed. No charge was made.");
      }
    })();

    hardTimeout = setTimeout(() => {
      if (!cancelled) {
        setStatus((s) =>
          s === "checking" ? "pending" : s
        );
        setMessage(
          "Payment is processing. You'll see it in your orders once Stripe confirms."
        );
      }
    }, 45_000);

    return () => {
      cancelled = true;
      if (hardTimeout) clearTimeout(hardTimeout);
      supabase.removeChannel(channel);
    };
  }, [params.session_id]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {status === "checking" && (
        <>
          <ActivityIndicator color={c.accent} />
          <Text style={[styles.title, { color: c.textPrimary }]}>Finalizing your payment…</Text>
        </>
      )}
      {status === "completed" && (
        <>
          <Text style={[styles.title, { color: c.success }]}>Payment successful</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>
            Your purchase has been recorded. Check your orders for the receipt.
          </Text>
        </>
      )}
      {status === "pending" && (
        <>
          <Text style={[styles.title, { color: c.warning }]}>Almost there</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>{message}</Text>
        </>
      )}
      {status === "error" && (
        <>
          <Text style={[styles.title, { color: c.error }]}>Something went wrong</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>{message}</Text>
        </>
      )}

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
    gap: 16,
    paddingHorizontal: 32,
  },
  title: { fontSize: 22, fontWeight: "600", textAlign: "center" },
  body: { fontSize: 14, textAlign: "center" },
  btn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontWeight: "600" },
});
