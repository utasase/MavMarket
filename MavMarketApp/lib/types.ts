import { type TextStyle, type ViewStyle } from "react-native";

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;
  surfaceOverlay: string;
  border: string;
  borderLight: string;
  hairline: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  accent: string;
  accentLight: string;
  accentSurface: string;
  accent50: string;
  accent100: string;
  accent200: string;
  accent500: string;
  accent600: string;
  accent700: string;
  success: string;
  successSurface: string;
  error: string;
  errorSurface: string;
  warning: string;
  warningSurface: string;
  messageBubbleOwn: string;
  messageBubbleOther: string;
  overlay: string;
  shadow: string;
  tabBar: string;
  tabBarBorder: string;
  star: string;
};

export type TypographyToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: TextStyle["fontWeight"];
};

export type TypographyScale = {
  display: TypographyToken;
  title: TypographyToken;
  headline: TypographyToken;
  body: TypographyToken;
  bodyStrong: TypographyToken;
  label: TypographyToken;
  caption: TypographyToken;
  overline: TypographyToken;
};

export type ElevationPreset = Pick<
  ViewStyle,
  | "shadowColor"
  | "shadowOffset"
  | "shadowOpacity"
  | "shadowRadius"
  | "elevation"
  | "borderWidth"
  | "borderColor"
>;

export type ElevationScale = {
  level1: ElevationPreset;
  level2: ElevationPreset;
  level3: ElevationPreset;
};

export type MotionTokens = {
  fast: number;
  base: number;
  slow: number;
  pressScale: number;
  listStagger: number;
  shimmer: number;
};

export type Theme = {
  dark: boolean;
  colors: ColorTokens;
  typography: TypographyScale;
  elevation: ElevationScale;
  motion: MotionTokens;
};

export type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

import { type Session, type User } from "@supabase/supabase-js";

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** True while the app is actively talking to Supabase (signing in/up). */
  loading: boolean;
  /** True only on first mount while a stored session is being restored. */
  initializing: boolean;
  justCompletedEmailConfirmation: boolean;
  error: string | null;
  info: string | null;
  clearConfirmed: () => void;
  clearMessages: () => void;
  /** Sign in with a UTA email + password via Supabase Auth. */
  loginWithPassword: (email: string, password: string) => Promise<void>;
  /** Create a new Supabase user, then sign in. */
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface ListingItem {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  sellerName: string;
  sellerAvatar: string;
  sellerRating: number;
  description: string;
  condition: string;
  postedAt: string;
  isSold: boolean;
  sellerId?: string;
  pickupLocation: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    isOnCampus: boolean;
  };
  lockedBy?: string;
  lockedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  contactName: string;
  contactAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  itemTitle: string;
  itemImage: string;
  messages: Message[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  followers: number;
  following: number;
  bio: string;
  major: string;
  year: string;
  listings: ListingItem[];
  isFollowing?: boolean;
}

export interface Notification {
  id: string;
  type: "follower" | "review" | "item_alert" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  itemImage?: string;
}
