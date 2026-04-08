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

  const switchToLoginMode = async () => {
    const buttons = renderer.root.findAllByType(TouchableOpacity);
    const loginBtn = buttons.find(b => {
      const text = b.findAllByType(Text).map(t => flattenText(t.props.children)).join("");
      return text.includes("Log In");
    });
    
    if (!loginBtn) throw new Error("Could not find Log In button");
    
    await act(async () => {
      loginBtn.props.onPress();
    });
  };

  const setEmail = async (email: string) => {
    const inputs = renderer.root.findAllByType(TextInput);
    const emailInput = inputs.find(i => i.props.placeholder?.includes("mavs.uta.edu"));
    if (!emailInput) throw new Error("Could not find email input");
    
    await act(async () => {
      emailInput.props.onChangeText(email);
    });
  };

  const pressForgotPassword = async () => {
    const buttons = renderer.root.findAllByType(TouchableOpacity);
    const forgotBtn = buttons.find(b => {
      const text = b.findAllByType(Text).map(t => flattenText(t.props.children)).join("");
      return text.includes("Forgot password?");
    });
    
    if (!forgotBtn) throw new Error("Could not find Forgot password? button");
    
    await act(async () => {
      forgotBtn.props.onPress();
    });
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
});
