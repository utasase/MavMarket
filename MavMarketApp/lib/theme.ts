// MavMarket Design Token System
// Dark-mode-first, premium & polished, Depop-inspired

import { Platform } from "react-native";
import {
  type ColorTokens,
  type ElevationScale,
  type MotionTokens,
  type Theme,
  type TypographyScale,
} from "./types";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const motion: MotionTokens = {
  fast: 120,
  base: 180,
  slow: 240,
  pressScale: 0.97,
  listStagger: 40,
  shimmer: 1200,
};

// System font fallback string — used when Inter hasn't finished loading yet.
const SYSTEM_FALLBACK = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
}) as string;

function font(weight: "regular" | "medium" | "semibold" | "bold" | "extrabold"): string {
  switch (weight) {
    case "regular":
      return "Inter_400Regular";
    case "medium":
      return "Inter_500Medium";
    case "semibold":
      return "Inter_600SemiBold";
    case "bold":
      return "Inter_700Bold";
    case "extrabold":
      return "Inter_800ExtraBold";
    default:
      return SYSTEM_FALLBACK;
  }
}

export const typography: TypographyScale = {
  display: {
    fontFamily: font("extrabold"),
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontWeight: "800",
  },
  title: {
    fontFamily: font("bold"),
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
    fontWeight: "700",
  },
  headline: {
    fontFamily: font("semibold"),
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    fontWeight: "600",
  },
  body: {
    fontFamily: font("regular"),
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    fontWeight: "400",
  },
  bodyStrong: {
    fontFamily: font("semibold"),
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    fontWeight: "600",
  },
  label: {
    fontFamily: font("medium"),
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.1,
    fontWeight: "500",
  },
  caption: {
    fontFamily: font("regular"),
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.2,
    fontWeight: "400",
  },
  overline: {
    fontFamily: font("semibold"),
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
};

const darkColors: ColorTokens = {
  background: "#0A0A0B",
  surface: "#141418",
  surfaceElevated: "#1C1C21",
  surfaceSunken: "#07070A",
  surfaceOverlay: "rgba(255,255,255,0.04)",
  border: "#2A2A2D",
  borderLight: "#1F1F22",
  hairline: "rgba(255,255,255,0.06)",
  textPrimary: "#F5F5F7",
  textSecondary: "#9898A0",
  textTertiary: "#636366",
  textInverse: "#0A0A0B",
  accent: "#0064B1",
  accentLight: "#1A8CFF",
  accentSurface: "rgba(26,140,255,0.12)",
  accent50: "rgba(26,140,255,0.06)",
  accent100: "rgba(26,140,255,0.12)",
  accent200: "rgba(26,140,255,0.2)",
  accent500: "#0064B1",
  accent600: "#0056A0",
  accent700: "#004785",
  success: "#30D158",
  successSurface: "rgba(48,209,88,0.14)",
  error: "#FF453A",
  errorSurface: "rgba(255,69,58,0.14)",
  warning: "#FFD60A",
  warningSurface: "rgba(255,214,10,0.14)",
  messageBubbleOwn: "#0064B1",
  messageBubbleOther: "#1C1C21",
  overlay: "rgba(0,0,0,0.6)",
  shadow: "#000000",
  tabBar: "rgba(10,10,11,0.72)",
  tabBarBorder: "rgba(255,255,255,0.06)",
  star: "#FFD60A",
};

const lightColors: ColorTokens = {
  background: "#FFFFFF",
  surface: "#F7F7F8",
  surfaceElevated: "#FFFFFF",
  surfaceSunken: "#F0F0F2",
  surfaceOverlay: "rgba(16,24,40,0.03)",
  border: "#E5E7EB",
  borderLight: "#F0F1F3",
  hairline: "rgba(16,24,40,0.08)",
  textPrimary: "#101828",
  textSecondary: "#475467",
  textTertiary: "#98A2B3",
  textInverse: "#FFFFFF",
  accent: "#0064B1",
  accentLight: "#0064B1",
  accentSurface: "rgba(0,100,177,0.1)",
  accent50: "#EAF3FB",
  accent100: "#C9E0F2",
  accent200: "#9EC7E6",
  accent500: "#0064B1",
  accent600: "#0056A0",
  accent700: "#004785",
  success: "#059669",
  successSurface: "rgba(5,150,105,0.1)",
  error: "#DC2626",
  errorSurface: "rgba(220,38,38,0.1)",
  warning: "#D97706",
  warningSurface: "rgba(217,119,6,0.1)",
  messageBubbleOwn: "#0064B1",
  messageBubbleOther: "#F0F1F3",
  overlay: "rgba(16,24,40,0.4)",
  shadow: "#101828",
  tabBar: "rgba(255,255,255,0.86)",
  tabBarBorder: "rgba(16,24,40,0.08)",
  star: "#F59E0B",
};

// Elevation presets. Dark mode prefers a 1px hairline + mild shadow to keep
// the scene layered without washing surfaces out. Light mode uses a soft
// iOS-style drop shadow.
function makeElevation(dark: boolean, colors: ColorTokens): ElevationScale {
  if (dark) {
    return {
      level1: {
        borderWidth: 1,
        borderColor: colors.hairline,
        shadowColor: "#000000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
      level2: {
        borderWidth: 1,
        borderColor: colors.hairline,
        shadowColor: "#000000",
        shadowOpacity: 0.28,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
      },
      level3: {
        borderWidth: 1,
        borderColor: colors.hairline,
        shadowColor: "#000000",
        shadowOpacity: 0.4,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
      },
    };
  }
  return {
    level1: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
    level2: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    level3: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
  };
}

export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
  typography,
  elevation: makeElevation(true, darkColors),
  motion,
};

export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
  typography,
  elevation: makeElevation(false, lightColors),
  motion,
};
