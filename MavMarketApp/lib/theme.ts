// MavMarket Design Token System
// Dark-mode-first, premium & polished, Depop-inspired

import { type ColorTokens, type Theme } from "./types";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#0A0A0B',
    surface: '#161618',
    surfaceElevated: '#1E1E21',
    border: '#2A2A2D',
    borderLight: '#1F1F22',
    textPrimary: '#F5F5F7',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    accent: '#0064B1',
    accentLight: '#1A8CFF',
    accentSurface: 'rgba(26,140,255,0.12)',
    success: '#30D158',
    successSurface: 'rgba(48,209,88,0.12)',
    error: '#FF453A',
    errorSurface: 'rgba(255,69,58,0.12)',
    warning: '#FFD60A',
    warningSurface: 'rgba(255,214,10,0.12)',
    messageBubbleOwn: '#0064B1',
    messageBubbleOther: '#1E1E21',
    overlay: 'rgba(0,0,0,0.6)',
    shadow: '#000000',
    tabBar: 'rgba(10,10,11,0.7)',
    tabBarBorder: 'rgba(255,255,255,0.06)',
    star: '#FFD60A',
  },
};

export const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    surfaceElevated: '#FFFFFF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    accent: '#0064B1',
    accentLight: '#0064B1',
    accentSurface: 'rgba(0,100,177,0.08)',
    success: '#059669',
    successSurface: 'rgba(5,150,105,0.08)',
    error: '#EF4444',
    errorSurface: 'rgba(239,68,68,0.08)',
    warning: '#D97706',
    warningSurface: 'rgba(217,119,6,0.08)',
    messageBubbleOwn: '#0064B1',
    messageBubbleOther: '#F3F4F6',
    overlay: 'rgba(0,0,0,0.4)',
    shadow: '#000000',
    tabBar: 'rgba(255,255,255,0.8)',
    tabBarBorder: 'rgba(0,0,0,0.06)',
    star: '#FACC15',
  },
};
