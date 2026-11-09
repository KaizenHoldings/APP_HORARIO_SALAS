/** Espaciado, radios y breakpoints de la nueva visual. */

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 9999,
} as const;

/** Ancho mínimo para considerar el dispositivo como tablet (igual que la pantalla actual). */
export const TABLET_MIN_WIDTH = 768;
