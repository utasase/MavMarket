import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  type AuthError,
  type Session,
} from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { type AuthContextType } from "./types";

const defaultAuthContext: AuthContextType = {
  session: null,
  user: null,
  loading: false,
  initializing: true,
  justCompletedEmailConfirmation: false,
  error: null,
  info: null,
  clearConfirmed: () => {},
  clearMessages: () => {},
  loginWithPassword: async () => {},
  signup: async () => {},
  logout: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

function isUtaEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return lower.endsWith("@mavs.uta.edu") || lower.endsWith("@uta.edu");
}

type FriendlyErrorInput = {
  message: string;
  code?: string | null;
};

function toFriendly(input: FriendlyErrorInput): string {
  const { message, code } = input;
  const lower = (message || "").toLowerCase();

  // Prefer stable error codes (Supabase GoTrue v2.62+).
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try signing in instead.";
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Please confirm your email before signing in.";
    case "weak_password":
      return message || "Password is too weak.";
    case "signup_disabled":
      return "Sign-ups are currently disabled for this project.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
  }

  // Fall back to message-string matching for older GoTrue responses.
  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("invalid sign up") ||
    lower === "invalid signup"
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("password should be at least")) {
    return message;
  }
  if (lower.includes("only uta emails")) {
    return "Please use your UTA email (@mavs.uta.edu or @uta.edu).";
  }
  return message || "Something went wrong.";
}

function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message) {
    const code =
      typeof (e as { code?: unknown }).code === "string"
        ? ((e as { code?: string }).code as string)
        : null;
    return toFriendly({ message: e.message, code });
  }
  if (typeof e === "string") return toFriendly({ message: e });
  return fallback;
}

/** Attach Supabase `code`/`status` onto a thrown Error so downstream mappers see them. */
function wrapAuthError(sbError: AuthError, label: string): Error {
  if (__DEV__) {
    console.error(`[Supabase auth] ${label} failed:`, {
      message: sbError.message,
      name: sbError.name,
      status: (sbError as AuthError & { status?: number }).status,
      code: (sbError as AuthError & { code?: string }).code,
    });
  }
  const err = new Error(sbError.message) as Error & {
    code?: string;
    status?: number;
    name: string;
  };
  err.name = sbError.name || "AuthError";
  const code = (sbError as AuthError & { code?: string }).code;
  const status = (sbError as AuthError & { status?: number }).status;
  if (code) err.code = code;
  if (status) err.status = status;
  return err;
}

/** Log unknown thrown values (e.g. TypeError: Failed to fetch). */
function logUnknownAuthError(label: string, e: unknown) {
  if (!__DEV__) return;
  if (e instanceof Error) {
    console.error(`[Supabase auth] ${label} threw:`, {
      message: e.message,
      name: e.name,
    });
  } else {
    console.error(`[Supabase auth] ${label} threw:`, e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [justCompletedEmailConfirmation, setJustCompletedEmailConfirmation] =
    useState(false);

  // Set by signup() so the next SIGNED_IN auth event triggers the welcome screen.
  const pendingSignupWelcome = useRef(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled) {
        setSession(data.session ?? null);
        setInitializing(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession ?? null);
        if (nextSession && pendingSignupWelcome.current) {
          pendingSignupWelcome.current = false;
          setJustCompletedEmailConfirmation(true);
        }
      }
    );

    return () => {
      cancelled = true;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      setInfo(null);
      try {
        if (!isUtaEmail(email)) {
          throw new Error(
            "Please use your UTA email (@mavs.uta.edu or @uta.edu)"
          );
        }
        const { data, error: sbError } = await supabase.auth.signInWithPassword(
          { email: email.trim(), password }
        );
        if (sbError) throw wrapAuthError(sbError, "signIn");
        if (data.session) setSession(data.session);
        setJustCompletedEmailConfirmation(false);
      } catch (e) {
        // Errors from wrapAuthError are already logged; catch the rest here.
        if (!(e instanceof Error) || !(e as { code?: string }).code) {
          logUnknownAuthError("signIn", e);
        }
        setError(getErrorMessage(e, "Login failed"));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      setLoading(true);
      setError(null);
      setInfo(null);
      try {
        if (!isUtaEmail(email)) {
          throw new Error(
            "Please use your UTA email (@mavs.uta.edu or @uta.edu)"
          );
        }
        const trimmedName = name?.trim();
        pendingSignupWelcome.current = true;
        const { data, error: sbError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: trimmedName
            ? { data: { display_name: trimmedName, name: trimmedName } }
            : undefined,
        });
        if (sbError) {
          pendingSignupWelcome.current = false;
          throw wrapAuthError(sbError, "signUp");
        }

        if (data.session) {
          // "Confirm email" is disabled — session is live immediately.
          setSession(data.session);
          setJustCompletedEmailConfirmation(true);
          pendingSignupWelcome.current = false;
        } else {
          // "Confirm email" is enabled on the project — no session yet.
          pendingSignupWelcome.current = false;
          setInfo("Check your UTA inbox to confirm your account.");
        }
      } catch (e) {
        if (!(e instanceof Error) || !(e as { code?: string }).code) {
          logUnknownAuthError("signUp", e);
        }
        setError(getErrorMessage(e, "Sign up failed"));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut error:", e);
    } finally {
      setSession(null);
      setJustCompletedEmailConfirmation(false);
      setError(null);
      setInfo(null);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setInfo(null);
  }, []);

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    loading,
    initializing,
    justCompletedEmailConfirmation,
    error,
    info,
    clearConfirmed: () => setJustCompletedEmailConfirmation(false),
    clearMessages,
    loginWithPassword,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => useContext(AuthContext);
