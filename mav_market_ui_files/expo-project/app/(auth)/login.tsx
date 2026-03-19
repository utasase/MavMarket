import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn, FadeInRight, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { MavLogo } from '../../components/MavLogo';
import { Colors } from '../../constants/colors';

type AuthMode = 'welcome' | 'login' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return email.toLowerCase().endsWith('@mavs.uta.edu') || email.toLowerCase().endsWith('@uta.edu');
  };

  const handleSubmit = () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!validateEmail(email)) { setError('Please use your UTA email (@mavs.uta.edu)'); return; }
    if (!password.trim() || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name'); return; }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1200);
  };

  if (mode === 'welcome') {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
        {/* Top section with logo */}
        <View style={styles.logoSection}>
          <Animated.View entering={FadeIn.delay(100).duration(500)}>
            <MavLogo size={80} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(250).duration(400)}>
            <Text style={styles.appName}>Mav Market</Text>
            <Text style={styles.tagline}>
              Buy and sell with fellow Mavericks.{'\n'}Sign in with your UTA email.
            </Text>
          </Animated.View>
        </View>

        {/* Bottom buttons */}
        <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.bottomButtons}>
          <Pressable
            onPress={() => setMode('login')}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Log In</Text>
            <ArrowRight size={16} color={Colors.white} />
          </Pressable>
          <Pressable
            onPress={() => setMode('signup')}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </Pressable>
          <Text style={styles.footerNote}>
            Exclusive to UTA students with @mavs.uta.edu email
          </Text>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Animated.View entering={SlideInRight.duration(300)} style={styles.container}>
        {/* Header */}
        <View style={styles.formHeader}>
          <Pressable onPress={() => { setMode('welcome'); setError(''); }}>
            <ChevronLeft size={24} color={Colors.black} strokeWidth={1.5} />
          </Pressable>
        </View>

        <ScrollView style={styles.formContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.formTitle}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={styles.formSubtitle}>
            {mode === 'login'
              ? 'Sign in with your UTA email'
              : 'Sign up with your UTA email to get started'}
          </Text>

          <View style={styles.formFields}>
            {/* Name field (signup only) */}
            {mode === 'signup' && (
              <View>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={16} color={Colors.gray400} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Your full name"
                    placeholderTextColor={Colors.gray400}
                    value={name}
                    onChangeText={(t) => { setName(t); setError(''); }}
                    style={styles.textInput}
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View>
              <Text style={styles.fieldLabel}>UTA Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={16} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  placeholder="yourname@mavs.uta.edu"
                  placeholderTextColor={Colors.gray400}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  placeholder="At least 6 characters"
                  placeholderTextColor={Colors.gray400}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  secureTextEntry={!showPassword}
                  style={[styles.textInput, { flex: 1 }]}
                  onSubmitEditing={handleSubmit}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword
                    ? <EyeOff size={16} color={Colors.gray400} />
                    : <Eye size={16} color={Colors.gray400} />
                  }
                </Pressable>
              </View>
            </View>

            {/* Error */}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* Forgot password */}
            {mode === 'login' && (
              <View style={{ alignItems: 'flex-end' }}>
                <Pressable>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Submit */}
        <View style={styles.submitSection}>
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {mode === 'login' ? 'Log In' : 'Create Account'}
                </Text>
                <ArrowRight size={16} color={Colors.white} />
              </>
            )}
          </Pressable>

          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Text
              onPress={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              style={styles.switchLink}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </Text>
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  logoSection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  appName: { fontSize: 24, color: Colors.black, textAlign: 'center', marginTop: 24, fontWeight: '600' },
  tagline: { fontSize: 14, color: Colors.gray400, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  bottomButtons: { paddingHorizontal: 24, paddingBottom: 48, gap: 12 },
  primaryBtn: {
    backgroundColor: Colors.black,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: { color: Colors.white, fontSize: 14, fontWeight: '500' },
  secondaryBtn: {
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.black, fontSize: 14, fontWeight: '500' },
  footerNote: { textAlign: 'center', fontSize: 11, color: Colors.gray400, marginTop: 8 },
  formHeader: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 8 },
  formContent: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  formTitle: { fontSize: 24, color: Colors.black, fontWeight: '600' },
  formSubtitle: { fontSize: 14, color: Colors.gray400, marginTop: 4 },
  formFields: { marginTop: 32, gap: 16 },
  fieldLabel: { fontSize: 12, color: Colors.gray500, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.black,
  },
  eyeBtn: { padding: 4 },
  error: { fontSize: 12, color: Colors.red500 },
  forgotText: { fontSize: 12, color: Colors.utaBlue },
  submitSection: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 16 },
  submitBtn: {
    backgroundColor: Colors.utaBlue,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: { color: Colors.white, fontSize: 14, fontWeight: '500' },
  switchText: { textAlign: 'center', fontSize: 11, color: Colors.gray400, marginTop: 16 },
  switchLink: { color: Colors.utaBlue },
});
