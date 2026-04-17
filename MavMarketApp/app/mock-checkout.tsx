import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Lock, CreditCard, ShieldCheck } from "lucide-react-native";
import { useTheme } from "../lib/ThemeContext";
import { Button } from "../components/ui/Button";
import { spacing, radius } from "../lib/theme";
import { calculateServiceFee, calculateTotal } from "../lib/payments";
import { markListingPurchased } from "../lib/demoPurchases";
import { type Theme } from "../lib/types";

export default function MockCheckoutScreen() {
  const params = useLocalSearchParams<{
    listingId?: string;
    title?: string;
    price?: string;
    image?: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.typography;
  const insets = useSafeAreaInsets();

  const title = typeof params.title === "string" ? params.title : "Demo item";
  const listingId =
    typeof params.listingId === "string" ? params.listingId : null;
  const priceNum = Number(params.price ?? 0) || 0;
  const fee = calculateServiceFee(priceNum);
  const total = calculateTotal(priceNum);

  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("04 / 30");
  const [cvc, setCvc] = useState("123");
  const [name, setName] = useState("Demo Student");
  const [processing, setProcessing] = useState(false);

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const handlePay = () => {
    if (processing) return;
    setProcessing(true);
    const sessionId = `demo-${Date.now()}`;
    // Flip the listing to "purchased" in the in-memory demo store so the
    // Home grid, Discover deck, and Saved list drop it immediately — no
    // backend available in demo mode to persist `status = sold`.
    markListingPurchased(listingId);
    // Give the user a brief "processing" beat so the button state reads as
    // a real charge, then jump straight to the existing success screen.
    setTimeout(() => {
      router.replace({
        pathname: "/payment-success",
        params: { session_id: sessionId, demo: "1" },
      });
    }, 1100);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.hairline }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color={c.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary, fontFamily: t.headline.fontFamily }]}>
          Checkout
        </Text>
        <View style={[styles.lockPill, { backgroundColor: c.surface, borderColor: c.hairline }]}>
          <Lock size={12} color={c.textSecondary} strokeWidth={2} />
          <Text style={[styles.lockPillText, { color: c.textSecondary }]}>
            Secure
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: c.surface,
              borderColor: c.hairline,
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: c.textSecondary, fontFamily: t.overline.fontFamily }]}>
            Order summary
          </Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryTitle, { color: c.textPrimary, fontFamily: t.bodyStrong.fontFamily }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.summaryPrice, { color: c.textPrimary, fontFamily: t.bodyStrong.fontFamily }]}>
              ${priceNum.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: c.hairline }]} />
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: c.textSecondary }]}>
              Item price
            </Text>
            <Text style={[styles.breakdownValue, { color: c.textSecondary }]}>
              ${priceNum.toFixed(2)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: c.textSecondary }]}>
              Service fee (5%)
            </Text>
            <Text style={[styles.breakdownValue, { color: c.textSecondary }]}>
              ${fee.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: c.hairline }]} />
          <View style={styles.breakdownRow}>
            <Text style={[styles.totalLabel, { color: c.textPrimary, fontFamily: t.bodyStrong.fontFamily }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: c.textPrimary, fontFamily: t.title.fontFamily }]}>
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: c.surface,
              borderColor: c.hairline,
            },
          ]}
        >
          <View style={styles.payMethodHeader}>
            <Text style={[styles.sectionLabel, { color: c.textSecondary, fontFamily: t.overline.fontFamily }]}>
              Payment method
            </Text>
            <View style={styles.cardBadge}>
              <CreditCard size={12} color={c.textSecondary} strokeWidth={2} />
              <Text style={[styles.cardBadgeText, { color: c.textSecondary }]}>
                Card
              </Text>
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
            Card number
          </Text>
          <TextInput
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="1234 1234 1234 1234"
            placeholderTextColor={c.textTertiary}
            keyboardType="number-pad"
            editable={!processing}
            style={[
              styles.input,
              { color: c.textPrimary, borderColor: c.border, backgroundColor: c.surfaceElevated },
            ]}
          />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
                Expiry
              </Text>
              <TextInput
                value={expiry}
                onChangeText={setExpiry}
                placeholder="MM / YY"
                placeholderTextColor={c.textTertiary}
                editable={!processing}
                style={[
                  styles.input,
                  { color: c.textPrimary, borderColor: c.border, backgroundColor: c.surfaceElevated },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
                CVC
              </Text>
              <TextInput
                value={cvc}
                onChangeText={setCvc}
                placeholder="123"
                placeholderTextColor={c.textTertiary}
                keyboardType="number-pad"
                secureTextEntry
                editable={!processing}
                style={[
                  styles.input,
                  { color: c.textPrimary, borderColor: c.border, backgroundColor: c.surfaceElevated },
                ]}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
            Name on card
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor={c.textTertiary}
            editable={!processing}
            style={[
              styles.input,
              { color: c.textPrimary, borderColor: c.border, backgroundColor: c.surfaceElevated },
            ]}
          />
        </View>

        <View style={styles.legalRow}>
          <ShieldCheck size={14} color={c.textTertiary} strokeWidth={1.75} />
          <Text style={[styles.legalText, { color: c.textTertiary, fontFamily: t.caption.fontFamily }]}>
            Demo checkout — no real card is charged. Mav Market will process
            live payments through Stripe in production.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.sm,
            backgroundColor: c.background,
            borderTopColor: c.hairline,
          },
        ]}
      >
        <Button
          label={processing ? "Processing…" : `Pay $${total.toFixed(2)}`}
          onPress={handlePay}
          loading={processing}
          disabled={processing}
          size="lg"
          variant="primary"
          fullWidth
          leftIcon={
            processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Lock size={14} color="#FFFFFF" strokeWidth={2.2} />
            )
          }
        />
      </View>
    </View>
  );
}

function makeStyles(_theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: "600",
    },
    lockPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    lockPillText: {
      fontSize: 11,
      fontWeight: "600",
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    card: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    sectionLabel: {
      fontSize: 11,
      letterSpacing: 1.2,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    summaryTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
    },
    summaryPrice: {
      fontSize: 15,
      fontWeight: "600",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      marginVertical: spacing.sm,
    },
    breakdownRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    breakdownLabel: {
      fontSize: 13,
    },
    breakdownValue: {
      fontSize: 13,
    },
    totalLabel: {
      fontSize: 15,
      fontWeight: "700",
    },
    totalValue: {
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    payMethodHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    cardBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    cardBadgeText: {
      fontSize: 11,
      fontWeight: "600",
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "500",
      marginTop: spacing.sm,
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
    },
    row2: {
      flexDirection: "row",
      gap: spacing.md,
    },
    legalRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    legalText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 15,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
  });
}
