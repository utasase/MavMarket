import React from "react";
import * as TestRenderer from "react-test-renderer";
import { TextInput, TouchableOpacity, Text } from "react-native";
import { LoginPage } from "../../components/LoginPage";
import { createSupabaseMock } from "../helpers/supabaseMock";

const { act } = TestRenderer;

// Mock dependencies
jest.mock("../../lib/supabase", () => {
  const { createSupabaseMock } = require("../helpers/supabaseMock");
  return {
    supabase: createSupabaseMock().client,
  };
});

// Access the mocked supabase to control its behavior
const { supabase } = require("../../lib/supabase");

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("lucide-react-native", () => {
  const makeIcon = () => () => null;
  return {
    Mail: makeIcon(),
    Lock: makeIcon(),
    Eye: makeIcon(),
    EyeOff: makeIcon(),
    ArrowRight: makeIcon(),
    User: makeIcon(),
    ChevronLeft: makeIcon(),
  };
});

jest.mock("../../components/MavLogo", () => ({
  MavLogo: () => null,
}));

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

describe("LoginPage Password Reset", () => {
  let renderer: TestRenderer.ReactTestRenderer;

  beforeEach(async () => {
    jest.clearAllMocks();
    await act(async () => {
      renderer = TestRenderer.create(<LoginPage />);
    });
  });

  const pressButton = async (label: string) => {
    const buttons = renderer.root.findAllByType(TouchableOpacity);
    const button = buttons.find(b => {
      const text = b.findAllByType(Text).map(t => flattenText(t.props.children)).join("");
      return text.includes(label);
    });

    if (!button) throw new Error(`Could not find ${label} button`);

    await act(async () => {
      button.props.onPress();
    });
  };

  const switchToLoginMode = async () => {
    await pressButton("Log In");
  };

  const switchToSignupMode = async () => {
    await pressButton("Create Account");
  };

  const setEmail = async (email: string) => {
    const inputs = renderer.root.findAllByType(TextInput);
    const emailInput = inputs.find(i => i.props.placeholder?.includes("mavs.uta.edu"));
    if (!emailInput) throw new Error("Could not find email input");
    
    await act(async () => {
      emailInput.props.onChangeText(email);
    });
  };

  const setName = async (name: string) => {
    const inputs = renderer.root.findAllByType(TextInput);
    const nameInput = inputs.find(i => i.props.placeholder === "Your full name");
    if (!nameInput) throw new Error("Could not find name input");

    await act(async () => {
      nameInput.props.onChangeText(name);
    });
  };

  const setPassword = async (password: string) => {
    const inputs = renderer.root.findAllByType(TextInput);
    const passwordInput = inputs.find(i => i.props.placeholder === "At least 6 characters");
    if (!passwordInput) throw new Error("Could not find password input");

    await act(async () => {
      passwordInput.props.onChangeText(password);
    });
  };

  const pressForgotPassword = async () => {
    await pressButton("Forgot password?");
  };

  const submitForm = async (label: string) => {
    await pressButton(label);
  };

  const getStatusText = () => {
    return renderer.root.findAllByType(Text)
      .map(t => flattenText(t.props.children))
      .join(" ");
  };

  it("shows error for empty email", async () => {
    await switchToLoginMode();
    await pressForgotPassword();
    expect(getStatusText()).toContain("Enter your email first");
  });

  it("shows error for non-UTA email", async () => {
    await switchToLoginMode();
    await setEmail("test@gmail.com");
    await pressForgotPassword();
    expect(getStatusText()).toContain("Please use your UTA email");
  });

  it("shows success message on real success", async () => {
    supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null });
    
    await switchToLoginMode();
    await setEmail("test@mavs.uta.edu");
    await pressForgotPassword();
    
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@mavs.uta.edu");
    expect(getStatusText()).toContain("Password reset email sent!");
  });

  it("shows failure message on real failure", async () => {
    const errorMessage = "User not found";
    supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ 
      data: null, 
      error: { message: errorMessage } 
    });
    
    await switchToLoginMode();
    await setEmail("unknown@mavs.uta.edu");
    await pressForgotPassword();
    
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("unknown@mavs.uta.edu");
    expect(getStatusText()).toContain(errorMessage);
    expect(getStatusText()).not.toContain("Password reset email sent!");
  });

  it("trims signup email and name before creating the account", async () => {
    supabase.auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: null });

    await switchToSignupMode();
    await setName("  Alice Example  ");
    await setEmail("  Alice@MAVS.UTA.EDU  ");
    await setPassword("secret12");
    await submitForm("Create Account");

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: "alice@mavs.uta.edu",
      password: "secret12",
      options: { data: { name: "Alice Example" } },
    });
    expect(getStatusText()).toContain("Account created! Check your email to confirm, then log in.");
  });
});
