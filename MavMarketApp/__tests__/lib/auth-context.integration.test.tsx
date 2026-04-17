import React from "react";
import * as TestRenderer from "react-test-renderer";
import { AuthProvider, useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";

const { act } = TestRenderer;

jest.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

type AuthListener = (
  event: string,
  session: unknown
) => void;

function captureAuth(onAuth: (auth: ReturnType<typeof useAuth>) => void) {
  return function Probe() {
    const auth = useAuth();
    React.useEffect(() => {
      onAuth(auth);
    }, [auth]);
    return null;
  };
}

async function renderProvider() {
  let current: ReturnType<typeof useAuth> | undefined;
  const Probe = captureAuth((a) => {
    current = a;
  });
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
  });
  // Flush post-mount effects (getSession, setInitializing).
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  return { renderer, getAuth: () => current! };
}

describe("AuthContext (Supabase email + password)", () => {
  let authListeners: AuthListener[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    authListeners = [];

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
      (cb: AuthListener) => {
        authListeners.push(cb);
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        };
      }
    );
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
  });

  it("finishes initializing to false when no stored session", async () => {
    const { getAuth } = await renderProvider();
    expect(getAuth().initializing).toBe(false);
    expect(getAuth().session).toBeNull();
    expect(getAuth().loading).toBe(false);
  });

  it("restores an existing Supabase session on mount", async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          access_token: "token",
          user: { id: "u1", email: "restored@mavs.uta.edu" },
        },
      },
      error: null,
    });

    const { getAuth } = await renderProvider();
    expect(getAuth().initializing).toBe(false);
    expect(getAuth().user?.email).toBe("restored@mavs.uta.edu");
  });

  it("loginWithPassword: happy path sets session", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: {
        session: {
          access_token: "token",
          user: { id: "u1", email: "student@mavs.uta.edu" },
        },
      },
      error: null,
    });

    const { getAuth } = await renderProvider();

    await act(async () => {
      await getAuth().loginWithPassword("student@mavs.uta.edu", "hunter22!");
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "student@mavs.uta.edu",
      password: "hunter22!",
    });
    expect(getAuth().session).not.toBeNull();
    expect(getAuth().user?.email).toBe("student@mavs.uta.edu");
    expect(getAuth().error).toBeNull();
    expect(getAuth().loading).toBe(false);
  });

  it("loginWithPassword: surfaces friendly error for bad credentials", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Invalid login credentials" },
    });

    const { getAuth } = await renderProvider();

    await act(async () => {
      await getAuth()
        .loginWithPassword("student@mavs.uta.edu", "bad")
        .catch(() => {});
    });

    expect(getAuth().session).toBeNull();
    expect(getAuth().error).toMatch(/incorrect email or password/i);
  });

  it("loginWithPassword: rejects non-UTA emails before hitting Supabase", async () => {
    const { getAuth } = await renderProvider();

    await act(async () => {
      await getAuth()
        .loginWithPassword("stranger@gmail.com", "hunter22!")
        .catch(() => {});
    });

    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(getAuth().error).toMatch(/UTA email/i);
  });

  it("signup: creates user and sets welcome flag when session is returned", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: {
        session: {
          access_token: "token",
          user: { id: "u2", email: "new@mavs.uta.edu" },
        },
        user: { id: "u2", email: "new@mavs.uta.edu" },
      },
      error: null,
    });

    const { getAuth } = await renderProvider();

    await act(async () => {
      await getAuth().signup("new@mavs.uta.edu", "hunter22!", "New User");
    });

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "new@mavs.uta.edu",
      password: "hunter22!",
      options: { data: { display_name: "New User", name: "New User" } },
    });
    expect(getAuth().session).not.toBeNull();
    expect(getAuth().justCompletedEmailConfirmation).toBe(true);
  });

  it("signup: shows info message when confirm-email is enabled (no session)", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: null, user: { id: "u3", email: "pending@mavs.uta.edu" } },
      error: null,
    });

    const { getAuth } = await renderProvider();

    await act(async () => {
      await getAuth().signup("pending@mavs.uta.edu", "hunter22!");
    });

    expect(getAuth().session).toBeNull();
    expect(getAuth().info).toMatch(/confirm your account/i);
    expect(getAuth().justCompletedEmailConfirmation).toBe(false);
  });

  it("signup: surfaces 'user already registered' as friendly message", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "User already registered", name: "AuthApiError" },
    });

    const { getAuth } = await renderProvider();

    await act(async () => {
      await getAuth()
        .signup("dup@mavs.uta.edu", "hunter22!")
        .catch(() => {});
    });

    expect(getAuth().error).toMatch(/already exists/i);
  });

  it("signup: maps AuthError.code 'user_already_exists' to friendly message", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: null, user: null },
      error: {
        message: "Invalid sign up",
        name: "AuthApiError",
        code: "user_already_exists",
        status: 422,
      },
    });

    const { getAuth } = await renderProvider();

    await act(async () => {
      await getAuth()
        .signup("dup@mavs.uta.edu", "hunter22!")
        .catch(() => {});
    });

    expect(getAuth().error).toMatch(/already exists/i);
  });

  it("signup: maps terse 'Invalid sign up' message to friendly 'already exists'", async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Invalid sign up", name: "AuthApiError" },
    });

    const { getAuth } = await renderProvider();

    await act(async () => {
      await getAuth()
        .signup("dup@mavs.uta.edu", "hunter22!")
        .catch(() => {});
    });

    expect(getAuth().error).toMatch(/already exists/i);
  });

  it("loginWithPassword: maps AuthError.code 'invalid_credentials' to friendly message", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: null, user: null },
      error: {
        message: "Invalid login credentials",
        name: "AuthApiError",
        code: "invalid_credentials",
        status: 400,
      },
    });

    const { getAuth } = await renderProvider();

    await act(async () => {
      await getAuth()
        .loginWithPassword("student@mavs.uta.edu", "bad")
        .catch(() => {});
    });

    expect(getAuth().error).toMatch(/incorrect email or password/i);
  });

  it("logout clears the session even when signOut throws", async () => {
    (supabase.auth.signOut as jest.Mock).mockRejectedValue(
      new Error("supabase offline")
    );

    const { getAuth } = await renderProvider();

    await act(async () => {
      await getAuth().logout();
    });

    expect(getAuth().session).toBeNull();
    expect(getAuth().justCompletedEmailConfirmation).toBe(false);
    expect(getAuth().error).toBeNull();
  });
});
