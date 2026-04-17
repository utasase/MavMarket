import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight } from "lucide-react-native";
import { MavLogo } from "./MavLogo";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/ThemeContext";
import { type AuthContextType } from "../lib/types";

type LoginAuthState = AuthContextType & {
  authError?: unknown;
  error?: unknown;
  authStatus?: unknown;
  statusMessage?: unknown;
  isRejected?: unknown;
  accessDenied?: unknown;
};

function toMessage(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value instanceof Error) {
    return toMessage(value.message);
  }

  if (value && typeof value === "object" && "message" in value) {
    return toMessage((value as { message?: unknown }).message);
  }

  return null;
}

function getAuthFeedback(authState: LoginAuthState) {
  const errorMessage = toMessage(authState.error) ?? toMessage(authState.authError);
  const statusMessage = toMessage(authState.authStatus) ?? toMessage(authState.statusMessage);
  const isAccessDenied = authState.isRejected === true || authState.accessDenied === true;

  if (errorMessage) {
    return { message: errorMessage, tone: "error" as const };
  }

  if (statusMessage && !authState.loading) {
    return { message: statusMessage, tone: isAccessDenied ? ("error" as const) : ("info" as const) };
  }

  return null;
}

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  welcomeCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  logoBox: { width: 80, height: 80, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 },
  welcomeTextContainer: { alignItems: "center", marginTop: 24 },
  welcomeTitle: { fontSize: 24, color: c.textPrimary, letterSpacing: -0.5 },
  welcomeSubtitle: { fontSize: 14, color: c.textTertiary, marginTop: 8, textAlign: "center", lineHeight: 22 },
  statusCard: { width: "100%", marginTop: 20, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1 },
  statusText: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  welcomeButtons: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  primaryBtn: { backgroundColor: c.textPrimary, paddingVertical: 14, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryBtnText: { color: c.background, fontSize: 14 },
  disclaimer: { textAlign: "center", fontSize: 11, color: c.textTertiary, marginTop: 4 },
  loadingContainer: { marginTop: 20 },
});

export function LoginPage() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = makeStyles(c);
  const authState = useAuth() as LoginAuthState;
  const { login, loading } = authState;
  const authFeedback = getAuthFeedback(authState);
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    await login();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.welcomeCenter}>
        <View style={styles.logoBox}>
          <MavLogo size={80} />
        </View>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeTitle}>Mav Market</Text>
          <Text style={styles.welcomeSubtitle}>
            Buy and sell with fellow Mavericks.{"\n"}Sign in with your UTA email.
          </Text>
        </View>
        {authFeedback ? (
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: authFeedback.tone === "error" ? c.errorSurface : c.accentSurface,
                borderColor: authFeedback.tone === "error" ? c.error : c.accent,
              },
            ]}
            accessibilityRole="alert"
          >
            <Text
              style={[
                styles.statusText,
                { color: authFeedback.tone === "error" ? c.error : c.textPrimary },
              ]}
            >
              {authFeedback.message}
            </Text>
          </View>
        ) : null}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={c.textPrimary} />
          </View>
        )}
      </View>
      <View style={styles.welcomeButtons}>
        <TouchableOpacity 
          onPress={handleLogin} 
          style={styles.primaryBtn} 
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>{loading ? "Signing In..." : "Log In / Get Started"}</Text>
          <ArrowRight size={16} color={c.background} />
        </TouchableOpacity>
        <Text style={styles.disclaimer}>Exclusive to UTA students with @mavs.uta.edu email</Text>
      </View>
    </View>
  );
}
