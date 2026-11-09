import type { Scheme } from './colors';

/**
 * Vidrio tipo iOS: desenfoque + velo de color + borde especular con brillo en las esquinas.
 * `edge` son los stops del borde en diagonal (esquina sup-izq → centro → esquina inf-der).
 */
export const glass = {
  dark: {
    blurTint: 'dark',
    blurIntensity: 40,
    fill: 'rgba(16, 24, 40, 0.38)',
    fillStrong: 'rgba(16, 24, 40, 0.62)',
    sheen: 'rgba(255, 255, 255, 0.10)',
    edge: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.28)'],
    thumb: 'rgba(255, 255, 255, 0.92)',
    thumbInk: '#0B1220',
    scrim: 'rgba(3, 6, 14, 0.45)',
    shadow: '#000000',
  },
  light: {
    blurTint: 'light',
    blurIntensity: 40,
    fill: 'rgba(255, 255, 255, 0.42)',
    fillStrong: 'rgba(255, 255, 255, 0.72)',
    sheen: 'rgba(255, 255, 255, 0.55)',
    edge: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0.80)'],
    thumb: '#0F172A',
    thumbInk: '#FFFFFF',
    scrim: 'rgba(15, 23, 42, 0.18)',
    shadow: '#0B2A5B',
  },
} as const satisfies Record<Scheme, Record<string, string | number | readonly string[]>>;

export type GlassTokens = (typeof glass)[Scheme];

/** Colores de CodeSlots. Oscuro = configuración de React Bits pedida; claro = su inverso. */
export const codeSlots = {
  dark: {
    accentColor: '#f5f5f5',
    inkColor: '#f5f5f5',
    slotColor: '#27272a',
    digitColor: '#18181b',
    dangerColor: '#ff3b30',
  },
  light: {
    accentColor: '#0f172a',
    inkColor: '#0f172a',
    slotColor: '#e2e8f0',
    digitColor: '#f8fafc',
    dangerColor: '#ff3b30',
  },
} as const satisfies Record<Scheme, Record<string, string>>;
