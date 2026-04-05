import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Linking } from "react-native";
import { type Session, type User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  confirmed: boolean;
  clearConfirmed: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  confirmed: false,
  clearConfirmed: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const processingDeepLink = useRef(false);

  const handleDeepLinkUrl = useCallback(async (url: string) => {
    if (!url.startsWith("mavmarket://")) return;
    processingDeepLink.current = true;
    try {
      await supabase.auth.exchangeCodeForSession(url);
    } catch (e) {
      console.error("Deep link auth error:", e);
      processingDeepLink.current = false;
    }
  }, []);

  useEffect(() => {
    // Resolve existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Watch for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "SIGNED_IN" && processingDeepLink.current) {
        setConfirmed(true);
        processingDeepLink.current = false;
      }
    });

    // Handle deep link if app was cold-started from the confirmation email
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLinkUrl(url);
    });

    // Handle deep link if app was already open when the link was tapped
    const linkingSub = Linking.addEventListener("url", ({ url }) => {
      handleDeepLinkUrl(url);
    });

    return () => {
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, [handleDeepLinkUrl]);

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      confirmed,
      clearConfirmed: () => setConfirmed(false),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
