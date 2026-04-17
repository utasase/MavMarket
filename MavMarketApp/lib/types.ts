export type ColorTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentLight: string;
  accentSurface: string;
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

export type Theme = {
  dark: boolean;
  colors: ColorTokens;
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
  loading: boolean;
  justCompletedEmailConfirmation: boolean;
  error: string | null;
  clearConfirmed: () => void;
  login: () => Promise<void>;
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
