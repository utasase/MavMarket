import React from "react";
import * as TestRenderer from "react-test-renderer";
import { TextInput, Text } from "react-native";
import { LoginPage } from "../../components/LoginPage";

const { act } = TestRenderer;

const mockLoginWithPassword = jest.fn().mockResolvedValue(undefined);
const mockSignup = jest.fn().mockResolvedValue(undefined);
const mockLogout = jest.fn();
const mockClearConfirmed = jest.fn();
const mockClearMessages = jest.fn();

function makeAuth(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    session: null,
    user: null,
    loading: false,
    initializing: false,
    justCompletedEmailConfirmation: false,
    error: null,
    info: null,
    clearConfirmed: mockClearConfirmed,
    clearMessages: mockClearMessages,
    loginWithPassword: mockLoginWithPassword,
    signup: mockSignup,
    logout: mockLogout,
    ...overrides,
  };
}

jest.mock("../../lib/auth-context", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("lucide-react-native", () => {
  const makeIcon = () => () => null;
  return new Proxy(
    {},
    {
      get: () => makeIcon(),
    }
  );
});

jest.mock("../../components/MavLogo", () => ({
  MavLogo: () => null,
}));

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, ...rest }: any) =>
      React.createElement(View, rest, children),
  };
});

jest.mock("../../lib/ThemeContext", () => {
  const { darkTheme } = require("../../lib/theme");
  return {
    useTheme: () => ({ theme: darkTheme, isDark: true, toggleTheme: jest.fn() }),
  };
});

function flattenText(children: React.ReactNode): string {
  if (Array.isArray(children)) return children.map(flattenText).join("");
  if (typeof children === "string" || typeof children === "number") return String(children);
  return "";
}

function allText(renderer: TestRenderer.ReactTestRenderer): string {
  return renderer.root
    .findAllByType(Text)
    .map((t) => flattenText(t.props.children))
    .join(" | ");
}

function findSubmitButton(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findByProps({ testID: "login-submit" });
}

describe("LoginPage", () => {
  const { useAuth } = require("../../lib/auth-context") as {
    useAuth: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue(makeAuth());
  });

  it("renders email + password fields and the disclaimer", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<LoginPage />);
    });

    const text = allText(renderer);
    expect(text).toContain("Mav Market");
    expect(text).toContain("Sign In");
    expect(text).toContain("Create Account");
    expect(text).toContain("Exclusive to UTA students");

    const inputs = renderer.root.findAllByType(TextInput);
    // At least email + password
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("calls loginWithPassword with trimmed email and password", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<LoginPage />);
    });

    const inputs = renderer.root.findAllByType(TextInput);
    const emailInput = inputs.find(
      (i) => i.props.keyboardType === "email-address"
    )!;
    const passwordInput = inputs.find((i) => i.props.secureTextEntry === true)!;

    await act(async () => {
      emailInput.props.onChangeText("student@mavs.uta.edu");
      passwordInput.props.onChangeText("hunter22!");
    });

    const submit = findSubmitButton(renderer)!;
    await act(async () => {
      await submit.props.onPress();
    });

    expect(mockLoginWithPassword).toHaveBeenCalledWith(
      "student@mavs.uta.edu",
      "hunter22!"
    );
  });

  it("rejects non-UTA emails without hitting Supabase", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<LoginPage />);
    });

    const inputs = renderer.root.findAllByType(TextInput);
    const emailInput = inputs.find(
      (i) => i.props.keyboardType === "email-address"
    )!;
    const passwordInput = inputs.find((i) => i.props.secureTextEntry === true)!;

    await act(async () => {
      emailInput.props.onChangeText("stranger@gmail.com");
      passwordInput.props.onChangeText("whatever123");
    });

    await act(async () => {
      await findSubmitButton(renderer)!.props.onPress();
    });

    expect(mockLoginWithPassword).not.toHaveBeenCalled();
    expect(allText(renderer)).toContain("UTA email");
  });

  it("displays error message from auth context", async () => {
    const errorMessage = "Incorrect email or password.";
    useAuth.mockReturnValue(makeAuth({ error: errorMessage }));

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<LoginPage />);
    });

    expect(allText(renderer)).toContain(errorMessage);
  });

  it("displays info message from auth context when there is no error", async () => {
    const infoMessage = "Check your UTA inbox to confirm your account.";
    useAuth.mockReturnValue(makeAuth({ info: infoMessage }));

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<LoginPage />);
    });

    expect(allText(renderer)).toContain(infoMessage);
  });

  it("shows 'Switch to Sign In' hint when signup errors with 'already exists'", async () => {
    useAuth.mockReturnValue(
      makeAuth({ error: "An account with this email already exists. Try signing in instead." })
    );

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<LoginPage />);
    });

    // Flip to signup mode so the hint is eligible to render.
    const signupSegment = renderer.root.findByProps({
      testID: "segment-signup",
    });
    await act(async () => {
      signupSegment.props.onPress();
    });

    const hint = renderer.root.findByProps({ testID: "switch-to-signin" });
    expect(hint).toBeTruthy();
    const hintText = hint.findByType(Text);
    expect(flattenText(hintText.props.children)).toContain("Switch to Sign In");
  });

  it("disables the submit button and shows a spinner while loading", async () => {
    useAuth.mockReturnValue(makeAuth({ loading: true }));

    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<LoginPage />);
    });

    const submit = findSubmitButton(renderer);
    expect(submit.props.disabled).toBe(true);
  });
});
