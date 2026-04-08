import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ChevronLeft } from "lucide-react-native";
import { MavLogo } from "./MavLogo";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/ThemeContext";

type AuthMode = "welcome" | "login" | "signup";

const makeStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  welcomeCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  logoBox: { width: 80, height: 80, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 },
  welcomeTextContainer: { alignItems: "center", marginTop: 24 },
  welcomeTitle: { fontSize: 24, color: c.textPrimary, letterSpacing: -0.5 },
  welcomeSubtitle: { fontSize: 14, color: c.textTertiary, marginTop: 8, textAlign: "center", lineHeight: 22 },
  welcomeButtons: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  primaryBtn: { backgroundColor: c.textPrimary, paddingVertical: 14, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryBtnText: { color: c.background, fontSize: 14 },
  secondaryBtn: { backgroundColor: c.background, paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: c.border },
  secondaryBtnText: { color: c.textPrimary, fontSize: 14 },
  disclaimer: { textAlign: "center", fontSize: 11, color: c.textTertiary, marginTop: 4 },
  formScroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { padding: 4, marginLeft: -4, marginBottom: 8 },
  formHeading: { marginTop: 16 },
  formTitle: { fontSize: 24, color: c.textPrimary },
  formSubtitle: { fontSize: 14, color: c.textTertiary, marginTop: 4 },
  fields: { marginTop: 32, gap: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, color: c.textSecondary },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, position: "relative" },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: c.textPrimary, padding: 0 },
  eyeBtn: { marginLeft: 8, padding: 2 },
  errorText: { fontSize: 12, color: "#EF4444" },
  successText: { fontSize: 12, color: "#16A34A" },
  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { fontSize: 12, color: "#0064B1" },
  submitContainer: { marginTop: 24, gap: 16 },
  submitBtn: { backgroundColor: "#0064B1", paddingVertical: 14, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: "#FFFFFF", fontSize: 14 },
  loadingDots: { flexDirection: "row", gap: 4 },
  loadingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFFFFF" },
  switchModeText: { textAlign: "center", fontSize: 11, color: c.textTertiary },
  switchModeLink: { color: "#0064B1" },
});

export function LoginPage() {
  const { theme } = useTheme();
  const c = theme.colors;
  const styles = makeStyles(c);

  const [mode, setMode] = useState<AuthMode>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const validateEmail = (e: string) =>
    e.toLowerCase().endsWith("@mavs.uta.edu") || e.toLowerCase().endsWith("@uta.edu");

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!validateEmail(email)) { setError("Please use your UTA email (@mavs.uta.edu)"); return; }
    if (!password.trim() || password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (mode === "signup" && !name.trim()) { setError("Please enter your name"); return; }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Auth state change in AuthProvider handles navigation automatically
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        // If email confirmation is required, show a message
        setSuccess("Account created! Check your email to confirm, then log in.");
        setMode("login");
      }
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("rate limit")) {
        setError("Too many login attempts. Please wait a few minutes before trying again.");
      } else if (msg.includes("invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setError("Enter your email first, then tap Forgot password"); return; }
    if (!validateEmail(email)) { setError("Please use your UTA email (@mavs.uta.edu)"); return; }
    
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message ?? "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "welcome") {
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
        </View>
        <View style={styles.welcomeButtons}>
          <TouchableOpacity onPress={() => setMode("login")} style={styles.primaryBtn} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Log In</Text>
            <ArrowRight size={16} color={c.background} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode("signup")} style={styles.secondaryBtn} activeOpacity={0.85}>
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>Exclusive to UTA students with @mavs.uta.edu email</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.formScroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => { setMode("welcome"); setError(""); setSuccess(""); }} style={styles.backBtn}>
          <ChevronLeft size={24} color={c.textPrimary} strokeWidth={1.5} />
        </TouchableOpacity>

        <View style={styles.formHeading}>
          <Text style={styles.formTitle}>{mode === "login" ? "Welcome back" : "Create account"}</Text>
          <Text style={styles.formSubtitle}>
            {mode === "login" ? "Sign in with your UTA email" : "Sign up with your UTA email to get started"}
          </Text>
        </View>

        <View style={styles.fields}>
          {mode === "signup" && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={16} color={c.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor={c.textTertiary}
                  value={name}
                  onChangeText={(t) => { setName(t); setError(""); }}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>UTA Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={16} color={c.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="yourname@mavs.uta.edu"
                placeholderTextColor={c.textTertiary}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(""); setSuccess(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={16} color={c.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                placeholderTextColor={c.textTertiary}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(""); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={16} color={c.textTertiary} /> : <Eye size={16} color={c.textTertiary} />}
              </TouchableOpacity>
            </View>
          </View>

          {error !== "" && <Text style={styles.errorText}>{error}</Text>}
          {success !== "" && <Text style={styles.successText}>{success}</Text>}

          {mode === "login" && (
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.submitContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingDots}>
                {[0, 1, 2].map((i) => <View key={i} style={styles.loadingDot} />)}
              </View>
            ) : (
              <>
                <Text style={styles.submitBtnText}>{mode === "login" ? "Log In" : "Create Account"}</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.switchModeText}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <Text style={styles.switchModeLink} onPress={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}>
              {mode === "login" ? "Sign up" : "Log in"}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
