import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth0 } from "react-native-auth0";
import { type Session, type User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { type AuthContextType } from "./types";

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  confirmed: false,
  error: null,
  clearConfirmed: () => {},
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { authorize, clearSession, user: auth0User, isLoading: auth0Loading, getCredentials } = useAuth0();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [justCompletedEmailConfirmation, setJustCompletedEmailConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSupabase = useCallback(async () => {
    if (auth0User) {
      // Enforce UTA domain restriction
      if (auth0User.email && !auth0User.email.endsWith("@mavs.uta.edu") && !auth0User.email.endsWith("@uta.edu")) {
        console.error("Non-UTA email rejected:", auth0User.email);
        setError("Please use your UTA email (@mavs.uta.edu or @uta.edu)");
        await clearSession();
        setSession(null);
      } else {
        try {
          const credentials = await getCredentials();
          if (credentials?.idToken) {
            // Exchange Auth0 ID Token for Supabase Session
            const { data: { session: sbSession }, error: sbError } = await supabase.auth.signInWithIdToken({
              provider: "auth0",
              token: credentials.idToken,
            });
            
            if (sbError) {
              console.error("Supabase sync error:", sbError);
              setError(sbError.message);
              setSession(null);
            } else {
              setSession(sbSession);
              setError(null);
            }
          }
        } catch (e) {
          console.error("Failed to get Auth0 credentials:", e);
          setError("Authentication failed");
          setSession(null);
        }
      }
    } else {
      setSession(null);
      // Sign out from Supabase if no Auth0 user
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  }, [auth0User, getCredentials, clearSession]);

  useEffect(() => {
    if (!auth0Loading) {
      syncSupabase();
    }
  }, [auth0User, auth0Loading, syncSupabase]);

  const login = async () => {
    setLoading(true);
    try {
      setError(null);
      await authorize({
        audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
      });
      // TODO: Only set this to true if the login was triggered by an email confirmation link
      setJustCompletedEmailConfirmation(false);
    } catch (e) {
      console.error("Auth0 login error:", e);
      setError("Login failed");
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await clearSession();
    } catch (e) {
      console.error("Auth0 clearSession error:", e);
    } finally {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Supabase signOut error:", e);
      }
      setSession(null);
      setJustCompletedEmailConfirmation(false);
      setError(null);
    }
  };

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    loading: loading || auth0Loading,
    justCompletedEmailConfirmation,
    error,
    clearConfirmed: () => setJustCompletedEmailConfirmation(false),
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => useContext(AuthContext);
