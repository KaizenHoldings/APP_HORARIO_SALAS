/**
 * Colores personalizables desde Admin → Colores.
 * `ORIGINAL_COLORS` son los del diseño; con ellos se usan exactamente los tonos originales.
 */
export interface ColorSet {
  available: string;
  soon: string;
  occupied: string;
  /** "Disponible" en la línea de tiempo (degradado azul). */
  free: string;
  /** Tono del degradado de fondo. */
  bg: string;
}

export type ColorKey = keyof ColorSet;

export const ORIGINAL_COLORS: ColorSet = {
  available: '#34C759',
  soon: '#FF9F0A',
  occupied: '#FF3B30',
  free: '#3B82F6',
  bg: '#1676F9',
};

export const COLOR_PRESETS: Record<ColorKey, string[]> = {
  available: ['#34C759', '#30D158', '#00C7BE', '#32ADE6', '#A3E635'],
  soon: ['#FF9F0A', '#FFCC00', '#FF6B00', '#F59E0B', '#E879F9'],
  occupied: ['#FF3B30', '#FF2D55', '#E11D48', '#DC2626', '#F97316'],
  free: ['#3B82F6', '#0A84FF', '#5E5CE6', '#06B6D4', '#64748B'],
  bg: ['#1676F9', '#5E5CE6', '#0EA5E9', '#14B8A6', '#64748B'],
};

export const COLOR_ROWS: { key: ColorKey; label: string; group: string }[] = [
  { key: 'available', label: 'Disponible', group: 'ESTADOS DE LA SALA' },
  { key: 'soon', label: 'Por ocuparse', group: 'ESTADOS DE LA SALA' },
  { key: 'occupied', label: 'Ocupada', group: 'ESTADOS DE LA SALA' },
  { key: 'free', label: 'Disponible en la barra', group: 'LÍNEA DE TIEMPO' },
  { key: 'bg', label: 'Tono del fondo', group: 'FONDO' },
];

export const sameColor = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mezcla `a` hacia `b` en proporción `t` (0–1). */
export function mixHex(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return (
    '#' +
    x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')
  );
}

export interface StatusTone {
  main: string;
  textLight: string;
  textDark: string;
}

const ORIGINAL_STATUS: Record<'available' | 'soon' | 'occupied', StatusTone> = {
  available: { main: '#34C759', textLight: '#15803D', textDark: '#4ADE80' },
  soon: { main: '#FF9F0A', textLight: '#C2410C', textDark: '#FFB340' },
  occupied: { main: '#FF3B30', textLight: '#B91C1C', textDark: '#FF6B61' },
};

function tone(hex: string, original: StatusTone): StatusTone {
  if (sameColor(hex, original.main)) return original;
  return { main: hex, textLight: mixHex(hex, '#000000', 0.3), textDark: mixHex(hex, '#ffffff', 0.3) };
}

export interface Palette {
  status: {
    available: StatusTone;
    soon: StatusTone;
    occupied: StatusTone;
    live: StatusTone;
  };
  /** Tono de "Disponible" en la barra (tarjeta de detalle). */
  free: StatusTone;
  /** Degradados de la línea de tiempo [inicio, fin]. */
  bars: { free: [string, string]; busy: [string, string] };
  /** Colores del fondo animado (o null para los originales). */
  background: { dark: string[]; light: string[] } | null;
}

const bgRamp = (bg: string) => ['#120f17', '#0a192a', mixHex(bg, '#000000', 0.35), bg, mixHex(bg, '#ffffff', 0.65)];

export function buildPalette(c: ColorSet): Palette {
  const freeOriginal = sameColor(c.free, ORIGINAL_COLORS.free);
  const busyOriginal = sameColor(c.occupied, ORIGINAL_COLORS.occupied);
  const bgOriginal = sameColor(c.bg, ORIGINAL_COLORS.bg);
  return {
    status: {
      available: tone(c.available, ORIGINAL_STATUS.available),
      soon: tone(c.soon, ORIGINAL_STATUS.soon),
      occupied: tone(c.occupied, ORIGINAL_STATUS.occupied),
      live: { main: '#007AFF', textLight: '#007AFF', textDark: '#0A84FF' },
    },
    free: freeOriginal
      ? { main: '#60A5FA', textLight: '#1D4ED8', textDark: '#93C5FD' }
      : { main: c.free, textLight: mixHex(c.free, '#000000', 0.35), textDark: mixHex(c.free, '#ffffff', 0.35) },
    bars: {
      free: freeOriginal ? ['#3B82F6', '#93C5FD'] : [c.free, mixHex(c.free, '#ffffff', 0.45)],
      busy: busyOriginal ? ['#FF8A80', '#FF3B30'] : [mixHex(c.occupied, '#ffffff', 0.4), c.occupied],
    },
    // Misma rampa en claro y oscuro: en claro el Grainient la aclara solo (lightMode).
    background: bgOriginal ? null : { dark: bgRamp(c.bg), light: bgRamp(c.bg) },
  };
}
