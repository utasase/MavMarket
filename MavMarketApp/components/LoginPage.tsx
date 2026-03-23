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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ChevronLeft } from "lucide-react-native";
import { MavLogo } from "./MavLogo";

interface LoginPageProps {
  onLogin: () => void;
}

type AuthMode = "welcome" | "login" | "signup";

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const validateEmail = (e: string) =>
    e.toLowerCase().endsWith("@mavs.uta.edu") || e.toLowerCase().endsWith("@uta.edu");

  const handleSubmit = () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please use your UTA email (@mavs.uta.edu)");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1200);
  };

  if (mode === "welcome") {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Top section */}
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

        {/* Buttons */}
        <View style={styles.welcomeButtons}>
          <TouchableOpacity
            onPress={() => setMode("login")}
            style={styles.primaryBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Log In</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode("signup")}
            style={styles.secondaryBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            Exclusive to UTA students with @mavs.uta.edu email
          </Text>
        </View>
      </View>
    );
  }


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[
          styles.formScroll,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => { setMode("welcome"); setError(""); }}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color="#111827" strokeWidth={1.5} />
        </TouchableOpacity>

        {/* Heading */}
        <View style={styles.formHeading}>
          <Text style={styles.formTitle}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </Text>
          <Text style={styles.formSubtitle}>
            {mode === "login"
              ? "Sign in with your UTA email"
              : "Sign up with your UTA email to get started"}
          </Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          {mode === "signup" && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor="#9CA3AF"
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
              <Mail size={16} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="yourname@mavs.uta.edu"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={16} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1, paddingRight: 40 }]}
                placeholder="At least 6 characters"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={(t) => { setPassword(t); setError(""); }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword
                  ? <EyeOff size={16} color="#9CA3AF" />
                  : <Eye size={16} color="#9CA3AF" />}
              </TouchableOpacity>
            </View>
          </View>

          {error !== "" && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {mode === "login" && (
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingDots}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.loadingDot} />
                ))}
              </View>
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {mode === "login" ? "Log In" : "Create Account"}
                </Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.switchModeText}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <Text
              style={styles.switchModeLink}
              onPress={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Welcome
  welcomeCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  welcomeTextContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    color: "#111827",
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
  },
  welcomeButtons: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryBtnText: {
    color: "#111827",
    fontSize: 14,
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
  },
  // Form
  formScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
    marginBottom: 8,
  },
  formHeading: {
    marginTop: 16,
  },
  formTitle: {
    fontSize: 24,
    color: "#111827",
  },
  formSubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  fields: {
    marginTop: 32,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "relative",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    padding: 0,
  },
  eyeBtn: {
    position: "absolute",
    right: 14,
    top: "50%",
    marginTop: -8,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
  },
  forgotBtn: {
    alignSelf: "flex-end",
  },
  forgotText: {
    fontSize: 12,
    color: "#0064B1",
  },
  submitContainer: {
    marginTop: 24,
    gap: 16,
  },
  submitBtn: {
    backgroundColor: "#0064B1",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  switchModeText: {
    textAlign: "center",
    fontSize: 11,
    color: "#9CA3AF",
  },
  switchModeLink: {
    color: "#0064B1",
  },
});
