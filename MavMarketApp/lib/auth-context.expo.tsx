import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { type AuthContextType } from "./types";
import {
  buildAuthRequestConfig,
  buildLogoutUrl,
  discovery,
  exchangeCodeForTokens,
  getRedirectUri,
  fetchUserInfo,
  type Auth0Tokens,
  type Auth0UserInfo,
} from "./auth-session-expo";

const TOKENS_KEY = "mavmarket.auth0.tokens.v1";

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  justCompletedEmailConfirmation: false,
  error: null,
  clearConfirmed: () => {},
  login: async () => {},
  logout: async () => {},
});

function isUtaEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.endsWith("@mavs.uta.edu") || email.endsWith("@uta.edu");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justCompletedEmailConfirmation, setJustCompletedEmailConfirmation] = useState(false);

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    buildAuthRequestConfig(),
    discovery
  );

  const persistTokens = useCallback(async (tokens: Auth0Tokens | null) => {
    if (!tokens) {
      await AsyncStorage.removeItem(TOKENS_KEY);
      return;
    }
    await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  }, []);

  const syncSupabase = useCallback(
    async (idToken: string, userInfo: Auth0UserInfo) => {
      if (!isUtaEmail(userInfo.email)) {
        setError("Please use your UTA email (@mavs.uta.edu or @uta.edu)");
        setSession(null);
        await persistTokens(null);
        return;
      }

      const { data, error: sbError } = await supabase.auth.signInWithIdToken({
        provider: "auth0",
        token: idToken,
      });

      if (sbError) {
        console.error("Supabase sync error:", sbError);
        setError(sbError.message);
        setSession(null);
        return;
      }

      setSession(data.session);
      setError(null);
    },
    [persistTokens]
  );

  const restoreSession = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(TOKENS_KEY);
      if (!raw) return;
      const tokens = JSON.parse(raw) as Auth0Tokens;
      if (!tokens?.idToken || !tokens?.accessToken) return;
      const userInfo = await fetchUserInfo(tokens.accessToken);
      await syncSupabase(tokens.idToken, userInfo);
    } catch (e) {
      console.warn("Session restore skipped:", e);
      await persistTokens(null);
    }
  }, [persistTokens, syncSupabase]);

  useEffect(() => {
    if (__DEV__) {
      console.log(
        "[Auth0/ExpoGo] Register this EXACT redirect URI in Auth0 → Allowed Callback URLs:\n" +
          getRedirectUri()
      );
    }
    (async () => {
      await restoreSession();
      setLoading(false);
    })();
  }, [restoreSession]);

  const login = useCallback(async () => {
    if (!request) {
      setError("Auth not ready yet — try again in a moment");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await promptAsync({
        showInRecents: false,
      });

      if (result.type !== "success" || !result.params.code) {
        if (result.type === "error") {
          setError(result.error?.message ?? "Login failed");
        }
        setLoading(false);
        return;
      }

      const codeVerifier = request.codeVerifier;
      if (!codeVerifier) throw new Error("Missing PKCE code_verifier");

      const tokens = await exchangeCodeForTokens(
        result.params.code,
        codeVerifier,
        getRedirectUri()
      );

      await persistTokens(tokens);
      const userInfo = await fetchUserInfo(tokens.accessToken);
      await syncSupabase(tokens.idToken, userInfo);
      setJustCompletedEmailConfirmation(false);
    } catch (e: any) {
      console.error("Expo Go Auth0 login error:", e);
      setError(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }, [promptAsync, request, persistTokens, syncSupabase]);

  const logout = useCallback(async () => {
    try {
      await persistTokens(null);
      const returnTo = getRedirectUri();
      await WebBrowser.openAuthSessionAsync(buildLogoutUrl(returnTo), returnTo);
    } catch (e) {
      console.warn("Auth0 logout browser error:", e);
    } finally {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Supabase signOut error:", e);
      }
      setSession(null);
      setJustCompletedEmailConfirmation(false);
      setError(null);
    }
  }, [persistTokens]);

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    loading,
    justCompletedEmailConfirmation,
    error,
    clearConfirmed: () => setJustCompletedEmailConfirmation(false),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => useContext(AuthContext);
