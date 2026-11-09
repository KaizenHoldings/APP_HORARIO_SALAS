/**
 * Colores de la nueva visual.
 *
 * Punto de partida: valores heredados de `src/constants/theme.ts` y DESIGN.md.
 * Se irán reemplazando a medida que se defina la nueva conceptualización.
 * No importar desde `@/constants/theme` para mantener esta capa aislada.
 */

export type Scheme = 'light' | 'dark';

export const palette = {
  light: {
    canvas: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceSelected: '#E2E8F0',
    ink: '#0F172A',
    inkSecondary: '#475569',
    inkMuted: '#94A3B8',
    hairline: 'rgba(15, 23, 42, 0.06)',
    accent: '#007AFF',
    accentMuted: 'rgba(0, 122, 255, 0.12)',
  },
  dark: {
    canvas: '#090D16',
    surface: '#131926',
    surfaceSelected: '#1E293B',
    ink: '#F8FAFC',
    inkSecondary: '#94A3B8',
    inkMuted: '#64748B',
    hairline: 'rgba(255, 255, 255, 0.04)',
    accent: '#0A84FF',
    accentMuted: 'rgba(10, 132, 255, 0.16)',
  },
} as const;

/** Señales de estado de la sala: verde libre, naranja por ocuparse, rojo ocupada. */
export const status = {
  available: { main: '#34C759', textLight: '#15803D', textDark: '#4ADE80' },
  soon: { main: '#FF9F0A', textLight: '#C2410C', textDark: '#FFB340' },
  occupied: { main: '#FF3B30', textLight: '#B91C1C', textDark: '#FF6B61' },
  live: { main: '#007AFF', textLight: '#007AFF', textDark: '#0A84FF' },
} as const;

export type StatusKey = keyof typeof status;
export type Palette = (typeof palette)[Scheme];
