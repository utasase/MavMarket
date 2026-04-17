import React from "react";
import * as TestRenderer from "react-test-renderer";
import { AuthProvider, useAuth } from "../../lib/auth-context";
import { useAuth0 } from "react-native-auth0";
import { supabase } from "../../lib/supabase";

const { act } = TestRenderer;

// Mock dependencies
jest.mock("react-native-auth0", () => ({
  useAuth0: jest.fn(),
  Auth0Provider: ({ children }: any) => children,
}));

jest.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithIdToken: jest.fn(),
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe("AuthContext Integration", () => {
  let mockAuth0: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth0 = {
      authorize: jest.fn().mockResolvedValue({}),
      clearSession: jest.fn().mockResolvedValue({}),
      user: null,
      isLoading: false,
      getCredentials: jest.fn().mockResolvedValue({ idToken: "fake-token" }),
    };
    (useAuth0 as jest.Mock).mockReturnValue(mockAuth0);
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: null });
    (supabase.auth.signInWithIdToken as jest.Mock).mockResolvedValue({ data: { session: { user: { id: "sb-user" } } }, error: null });
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
  });

  const TestComponent = ({ onAuth }: { onAuth: (auth: any) => void }) => {
    const auth = useAuth();
    React.useEffect(() => {
      onAuth(auth);
    }, [auth]);
    return null;
  };

  it("Test A: justCompletedEmailConfirmation is false after normal login", async () => {
    let currentAuth: any;
    await act(async () => {
      TestRenderer.create(
        <AuthProvider>
          <TestComponent onAuth={(auth) => { currentAuth = auth; }} />
        </AuthProvider>
      );
    });

    await act(async () => {
      await currentAuth.login();
    });

    expect(currentAuth.justCompletedEmailConfirmation).toBe(false);
  });

  it("Test B: loading state is true during sign-in", async () => {
    let currentAuth: any;
    let resolveLogin: any;
    const loginPromise = new Promise((resolve) => { resolveLogin = resolve; });
    
    mockAuth0.authorize.mockReturnValue(loginPromise);

    let renderer: any;
    await act(async () => {
      renderer = TestRenderer.create(
        <AuthProvider>
          <TestComponent onAuth={(auth) => { currentAuth = auth; }} />
        </AuthProvider>
      );
    });

    // Wait for initial loading to finish
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    expect(currentAuth.loading).toBe(false);

    let midFlightLoading: boolean = false;
    
    // Start login
    let loginCall: Promise<void>;
    await act(async () => {
      // Simulate Auth0 starting to load
      const loadingMock = { ...mockAuth0, isLoading: true };
      (useAuth0 as jest.Mock).mockReturnValue(loadingMock);
      
      loginCall = currentAuth.login();
    });

    // Force re-render to see mid-flight loading
    await act(async () => {
      renderer.update(
        <AuthProvider>
          <TestComponent onAuth={(auth) => { currentAuth = auth; }} />
        </AuthProvider>
      );
    });
    midFlightLoading = currentAuth.loading;
    
    await act(async () => {
      // Update mock to simulate user change and loading finished
      const updatedMock = { ...mockAuth0, user: { email: "test@mavs.uta.edu" }, isLoading: false };
      (useAuth0 as jest.Mock).mockReturnValue(updatedMock);
      
      resolveLogin({});
      await loginCall;
    });

    // Wait for all async effects to settle
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
        renderer.update(
          <AuthProvider>
            <TestComponent onAuth={(auth) => { currentAuth = auth; }} />
          </AuthProvider>
        );
      });
    }

    expect(midFlightLoading).toBe(true);
    expect(currentAuth.loading).toBe(false);
  });

  it("Test C: logout clears Supabase session even when clearSession throws", async () => {
    mockAuth0.clearSession.mockRejectedValue(new Error("Auth0 Error"));
    mockAuth0.user = { email: "test@uta.edu" };

    let currentAuth: any;
    await act(async () => {
      TestRenderer.create(
        <AuthProvider>
          <TestComponent onAuth={(auth) => { currentAuth = auth; }} />
        </AuthProvider>
      );
    });

    await act(async () => {
      await currentAuth.logout();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(currentAuth.session).toBeNull();
  });
});
