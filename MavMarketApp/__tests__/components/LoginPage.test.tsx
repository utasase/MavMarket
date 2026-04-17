import React from "react";
import * as TestRenderer from "react-test-renderer";
import { TouchableOpacity, Text } from "react-native";
import { LoginPage } from "../../components/LoginPage";

const { act } = TestRenderer;

// Mock Auth Context
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockClearConfirmed = jest.fn();

jest.mock("../../lib/auth-context", () => ({
  useAuth: () => ({
    session: null,
    user: null,
    loading: false,
    confirmed: false,
    error: null,
    clearConfirmed: mockClearConfirmed,
    login: mockLogin,
    logout: mockLogout,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("lucide-react-native", () => {
  const makeIcon = () => () => null;
  return {
    ArrowRight: makeIcon(),
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

describe("LoginPage", () => {
  let renderer: TestRenderer.ReactTestRenderer;

  beforeEach(async () => {
    jest.clearAllMocks();
    await act(async () => {
      renderer = TestRenderer.create(<LoginPage />);
    });
  });

  const getStatusText = () => {
    return renderer.root.findAllByType(Text)
      .map(t => flattenText(t.props.children))
      .join(" ");
  };

  it("renders the login button and disclaimer", () => {
    const text = getStatusText();
    expect(text).toContain("Mav Market");
    expect(text).toContain("Exclusive to UTA students with @mavs.uta.edu email");
    expect(renderer.root.findByType(TouchableOpacity)).toBeTruthy();
  });

  it("calls login when the button is pressed", async () => {
    const button = renderer.root.findByType(TouchableOpacity);
    await act(async () => {
      button.props.onPress();
    });
    expect(mockLogin).toHaveBeenCalled();
  });

  it("displays error message from auth context", async () => {
    const errorMessage = "Please use your UTA email (@mavs.uta.edu or @uta.edu)";
    
    // Update mock for this test
    const { useAuth } = require("../../lib/auth-context");
    jest.spyOn(require("../../lib/auth-context"), "useAuth").mockReturnValue({
      session: null,
      user: null,
      loading: false,
      confirmed: false,
      error: errorMessage,
      clearConfirmed: mockClearConfirmed,
      login: mockLogin,
      logout: mockLogout,
    });

    await act(async () => {
      renderer.update(<LoginPage />);
    });

    expect(getStatusText()).toContain(errorMessage);
  });

  it("shows loading state when auth is loading", async () => {
    jest.spyOn(require("../../lib/auth-context"), "useAuth").mockReturnValue({
      session: null,
      user: null,
      loading: true,
      confirmed: false,
      error: null,
      clearConfirmed: mockClearConfirmed,
      login: mockLogin,
      logout: mockLogout,
    });

    await act(async () => {
      renderer.update(<LoginPage />);
    });

    const button = renderer.root.findByType(TouchableOpacity);
    expect(flattenText(button.findByType(Text).props.children)).toContain("Signing In...");
    expect(button.props.disabled).toBe(true);
  });
});
