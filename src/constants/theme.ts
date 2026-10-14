/**
 * Design Tokens: Apple Glassmorphism + Impeccable Craft
 * Tokens optimizados para quioscos y tablets táctiles de salas de reunión.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    background: "#F1F5F9",
    backgroundElement: "#FFFFFF",
    backgroundSelected: "#E2E8F0",
    border: "rgba(226, 232, 240, 0.8)",
    tint: "#007AFF",
    tintMuted: "rgba(0, 122, 255, 0.12)",
  },
  dark: {
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    background: "#090D16",
    backgroundElement: "#131926",
    backgroundSelected: "#1E293B",
    border: "rgba(255, 255, 255, 0.08)",
    tint: "#0A84FF",
    tintMuted: "rgba(10, 132, 255, 0.16)",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Tokens de Vidrio y Efecto Glassmorphism tipo Apple */
export const GlassTokens = {
  light: {
    surfacePrimary: "rgba(255, 255, 255, 0.82)",
    surfaceSecondary: "rgba(248, 250, 252, 0.72)",
    surfaceElevated: "rgba(255, 255, 255, 0.92)",
    surfaceUltraThin: "rgba(255, 255, 255, 0.50)",
    borderSpec: "rgba(255, 255, 255, 0.85)",
    borderSubtle: "rgba(203, 213, 225, 0.55)",
    hairline: "rgba(15, 23, 42, 0.06)",
  },
  dark: {
    surfacePrimary: "rgba(19, 25, 38, 0.80)",
    surfaceSecondary: "rgba(27, 35, 52, 0.65)",
    surfaceElevated: "rgba(33, 43, 64, 0.90)",
    surfaceUltraThin: "rgba(255, 255, 255, 0.05)",
    borderSpec: "rgba(255, 255, 255, 0.16)",
    borderSubtle: "rgba(255, 255, 255, 0.08)",
    hairline: "rgba(255, 255, 255, 0.04)",
  },
} as const;

/** Estados de sala en tiempo real con estética Apple */
export const RoomStatusColors = {
  available: {
    main: "#34C759", // Apple Emerald
    accentLight: "#16A34A",
    accentDark: "#4ADE80",
    bgGlassLight: "rgba(52, 199, 89, 0.10)",
    bgGlassDark: "rgba(52, 199, 89, 0.18)",
    borderLight: "rgba(52, 199, 89, 0.35)",
    borderDark: "rgba(52, 199, 89, 0.40)",
    gradientLight: ["rgba(255, 255, 255, 0.95)", "rgba(240, 253, 244, 0.90)"] as [string, string],
    gradientDark: ["rgba(20, 30, 26, 0.90)", "rgba(15, 23, 20, 0.85)"] as [string, string],
  },
  occupied: {
    main: "#FF3B30", // Apple Crimson
    accentLight: "#DC2626",
    accentDark: "#F87171",
    bgGlassLight: "rgba(255, 59, 48, 0.09)",
    bgGlassDark: "rgba(255, 59, 48, 0.18)",
    borderLight: "rgba(255, 59, 48, 0.30)",
    borderDark: "rgba(255, 59, 48, 0.40)",
    gradientLight: ["rgba(255, 255, 255, 0.95)", "rgba(254, 242, 242, 0.90)"] as [string, string],
    gradientDark: ["rgba(36, 18, 22, 0.90)", "rgba(26, 14, 18, 0.85)"] as [string, string],
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radii = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 9999,
} as const;

export const Shadows = {
  glassCard: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 4,
  },
  glassElevated: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 36,
    elevation: 10,
  },
  subtle: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1100;
