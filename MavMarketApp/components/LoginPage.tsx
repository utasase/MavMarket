import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldCheck, Eye, EyeOff, ArrowRight } from "lucide-react-native";
import { MavLogo } from "./MavLogo";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/ThemeContext";
import { AuthBackground } from "./ui/AuthBackground";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { radius, spacing } from "../lib/theme";

type Mode = "signin" | "signup";

function isUtaEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return lower.endsWith("@mavs.uta.edu") || lower.endsWith("@uta.edu");
}

function validate(mode: Mode, email: string, password: string, confirm: string) {
  if (!email.trim()) return "Email is required.";
  if (!isUtaEmail(email)) {
    return "Please use your UTA email (@mavs.uta.edu or @uta.edu).";
  }
  if (!password) return "Password is required.";
  if (mode === "signup") {
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (confirm !== password) return "Passwords do not match.";
  }
  return null;
}

export function LoginPage() {
  const { theme } = useTheme();
  const c = theme.colors;
  const t = theme.typography;
  const insets = useSafeAreaInsets();
  const { loginWithPassword, signup, loading, error, info, clearMessages } =
    useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const segmentAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (next: Mode) => {
    setMode(next);
    setLocalError(null);
    clearMessages();
    Animated.spring(segmentAnim, {
      toValue: next === "signin" ? 0 : 1,
      speed: 22,
      bounciness: 6,
      useNativeDriver: false,
    }).start();
  };

  const handleSubmit = async () => {
    const validationError = validate(mode, email, password, confirm);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    try {
      if (mode === "signin") {
        await loginWithPassword(email, password);
      } else {
        await signup(email, password, name);
      }
    } catch {
      // `error` from context will surface the message; swallow here.
    }
  };

  const displayError = localError ?? error;
  const displayInfo = !displayError ? info : null;
  const isBusy = loading;
  const showSwitchToSignIn =
    mode === "signup" &&
    !!displayError &&
    /already exists/i.test(displayError);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: c.background },
        scroll: {
          flexGrow: 1,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
        },
        header: {
          alignItems: "center",
          paddingTop: Math.max(insets.top + spacing.xxl, spacing.huge),
          paddingBottom: spacing.xxl,
        },
        logoFrame: {
          width: 72,
          height: 72,
          borderRadius: radius.xl,
          overflow: "hidden",
        },
        title: {
          color: c.textPrimary,
          fontFamily: t.title.fontFamily,
          fontSize: 28,
          lineHeight: 34,
          letterSpacing: -0.4,
          fontWeight: "700",
          marginTop: spacing.lg,
        },
        subtitle: {
          color: c.textSecondary,
          fontFamily: t.body.fontFamily,
          fontSize: t.body.fontSize,
          lineHeight: t.body.lineHeight,
          textAlign: "center",
          marginTop: spacing.xs,
          maxWidth: 320,
        },
        segmentTrack: {
          flexDirection: "row",
          backgroundColor: c.surface,
          borderRadius: radius.full,
          padding: 4,
          borderWidth: 1,
          borderColor: c.border,
          alignSelf: "center",
          marginBottom: spacing.xl,
          width: "100%",
          maxWidth: 360,
        },
        segmentThumb: {
          position: "absolute",
          top: 4,
          bottom: 4,
          width: "50%",
          backgroundColor: c.surfaceElevated,
          borderRadius: radius.full,
          ...(theme.elevation.level1 as object),
        },
        segmentBtn: {
          flex: 1,
          paddingVertical: spacing.md,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        },
        segmentLabel: {
          fontFamily: t.label.fontFamily,
          fontSize: 13,
          letterSpacing: 0.1,
          fontWeight: "600",
        },
        formStack: {
          alignSelf: "center",
          width: "100%",
          maxWidth: 420,
          gap: spacing.md,
        },
        statusCard: {
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderWidth: 1,
        },
        statusText: {
          fontFamily: t.body.fontFamily,
          fontSize: 13,
          lineHeight: 18,
        },
        helperRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginTop: spacing.xs,
          paddingHorizontal: spacing.sm,
        },
        helperText: {
          flex: 1,
          color: c.textTertiary,
          fontFamily: t.caption.fontFamily,
          fontSize: t.caption.fontSize,
          lineHeight: t.caption.lineHeight,
        },
        linkBtn: { alignItems: "center", marginTop: spacing.md },
        linkText: {
          color: c.accentLight,
          fontFamily: t.label.fontFamily,
          fontSize: 13,
          fontWeight: "600",
        },
        footerNote: {
          marginTop: spacing.xl,
          textAlign: "center",
          color: c.textTertiary,
          fontFamily: t.caption.fontFamily,
          fontSize: t.caption.fontSize,
          lineHeight: t.caption.lineHeight,
        },
        eyeBtn: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
        },
      }),
    [c, t, theme.elevation, insets]
  );

  const segmentLeft = segmentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "50%"],
  });

  return (
    <View style={styles.root}>
      <AuthBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.logoFrame, theme.elevation.level2]}>
              <MavLogo size={72} />
            </View>
            <Text style={styles.title}>Mav Market</Text>
            <Text style={styles.subtitle}>
              Buy and sell with fellow Mavericks. Sign in with your UTA email.
            </Text>
          </View>

          <View style={styles.formStack}>
            {/* Segmented control */}
            <View style={styles.segmentTrack}>
              <Animated.View
                style={[styles.segmentThumb, { left: segmentLeft }]}
              />
              <TouchableOpacity
                onPress={() => switchMode("signin")}
                style={styles.segmentBtn}
                activeOpacity={0.85}
                disabled={isBusy}
                testID="segment-signin"
                accessibilityRole="button"
                accessibilityState={{ selected: mode === "signin" }}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    {
                      color:
                        mode === "signin" ? c.textPrimary : c.textSecondary,
                    },
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => switchMode("signup")}
                style={styles.segmentBtn}
                activeOpacity={0.85}
                disabled={isBusy}
                testID="segment-signup"
                accessibilityRole="button"
                accessibilityState={{ selected: mode === "signup" }}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    {
                      color:
                        mode === "signup" ? c.textPrimary : c.textSecondary,
                    },
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {mode === "signup" && (
              <Field
                label="Name (optional)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!isBusy}
              />
            )}

            <Field
              label="UTA Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@mavs.uta.edu"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!isBusy}
            />

            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder={
                mode === "signup" ? "At least 8 characters" : undefined
              }
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={mode === "signup" ? "password-new" : "password"}
              textContentType={mode === "signup" ? "newPassword" : "password"}
              editable={!isBusy}
              onSubmitEditing={handleSubmit}
              returnKeyType={mode === "signin" ? "go" : "next"}
              rightAdornment={
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} color={c.textTertiary} />
                  ) : (
                    <Eye size={18} color={c.textTertiary} />
                  )}
                </Pressable>
              }
            />

            {mode === "signup" && (
              <Field
                label="Confirm Password"
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isBusy}
                onSubmitEditing={handleSubmit}
                returnKeyType="go"
              />
            )}

            <View style={styles.helperRow}>
              <ShieldCheck size={14} color={c.accentLight} />
              <Text style={styles.helperText}>
                UTA email only. We use it to verify you're a Maverick.
              </Text>
            </View>

            {displayError ? (
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: c.errorSurface,
                    borderColor: c.error,
                  },
                ]}
                accessibilityRole="alert"
              >
                <Text style={[styles.statusText, { color: c.error }]}>
                  {displayError}
                </Text>
                {showSwitchToSignIn ? (
                  <TouchableOpacity
                    onPress={() => switchMode("signin")}
                    disabled={isBusy}
                    testID="switch-to-signin"
                    style={{ marginTop: spacing.xs }}
                  >
                    <Text
                      style={[
                        styles.linkText,
                        { color: c.error, fontSize: 13 },
                      ]}
                    >
                      Switch to Sign In
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : displayInfo ? (
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: c.successSurface,
                    borderColor: c.success,
                  },
                ]}
                accessibilityRole="alert"
              >
                <Text style={[styles.statusText, { color: c.success }]}>
                  {displayInfo}
                </Text>
              </View>
            ) : null}

            <Button
              label={mode === "signin" ? "Sign In" : "Create Account"}
              onPress={handleSubmit}
              loading={isBusy}
              disabled={isBusy}
              size="lg"
              fullWidth
              rightIcon={<ArrowRight size={18} color="#FFFFFF" />}
              testID="login-submit"
              style={{ marginTop: spacing.sm }}
            />

            {mode === "signin" ? (
              <TouchableOpacity style={styles.linkBtn} disabled={isBusy}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => switchMode(mode === "signin" ? "signup" : "signin")}
              style={styles.linkBtn}
              disabled={isBusy}
            >
              <Text style={[styles.linkText, { color: c.textSecondary }]}>
                {mode === "signin"
                  ? "New to Mav Market? Create an account"
                  : "Already have an account? Sign in instead"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              Exclusive to UTA students with a @mavs.uta.edu email. By
              continuing you agree to Mav Market's terms of service.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Silence `TextInput` unused-import warning in environments where the Field
// primitive is shaken out of the bundle during type-only checks.
void TextInput;
