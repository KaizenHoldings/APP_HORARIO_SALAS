import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Grainient — degradado animado con grano.
 * Port de React Bits (https://reactbits.dev/backgrounds/grainient, variante JS-CSS).
 *
 * - Web: `grainient.web.tsx` (WebGL2, código original de React Bits en TypeScript).
 * - iOS/Android: `grainient.tsx` (mismo shader adaptado a SkSL con react-native-skia).
 *
 * Este archivo contiene lo que comparten ambas plataformas: props, defaults y la
 * conversión de colores a la rampa OKLab que consume el shader.
 */

export interface GrainientProps {
  /** Colores hex (#rgb o #rrggbb), de 2 a 8. */
  colors?: string[];
  type?: 'linear' | 'radial';
  /** Ángulo del degradado en grados. */
  angle?: number;
  bands?: number;
  speed?: number;
  flow?: number;
  scale?: number;
  softness?: number;
  silk?: number;
  grainAmount?: number;
  grainSize?: number;
  grainAnimated?: boolean;
  contrast?: number;
  saturation?: number;
  variation?: number;
  /** Solo web: el cursor "remueve" el degradado. */
  interactive?: boolean;
  /** Solo web: intensidad del efecto del cursor. */
  stir?: number;
  /** Solo web: remolino al hacer clic. */
  clickSwirl?: boolean;
  /** Animación de entrada (revelado desde el primer color). */
  intro?: boolean;
  /** Invierte la rampa a tonos claros (versión light del mismo set de colores). */
  lightMode?: boolean;
  /** Web: densidad de píxeles máxima (por defecto devicePixelRatio, tope 2). */
  dpr?: number;
  /**
   * Nativo: fracción de resolución a la que se calcula el shader (0.25–1).
   * El degradado es suave, así que 0.5 se ve igual y cuesta 4× menos GPU.
   */
  resolution?: number;
  style?: StyleProp<ViewStyle>;
}

export const MAX_COLORS = 8;
export const INTRO_SECONDS = 1.6;
export const DEFAULT_COLORS = ['#120f17', '#2a0f0a', '#9a3412', '#f97316', '#fed7aa'];
const TYPES = { linear: 0, radial: 1 } as const;
const LIFT = 0.2;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function resolveSettings(props: GrainientProps) {
  const {
    colors = DEFAULT_COLORS,
    type = 'linear',
    angle = 55,
    bands = 1,
    speed = 1,
    flow = 0.8,
    scale = 1,
    softness = 1,
    silk = 0.35,
    grainAmount = 0.08,
    grainSize = 1.2,
    grainAnimated = true,
    contrast = 1,
    saturation = 1,
    variation = 0,
    interactive = true,
    stir = 1,
    clickSwirl = true,
    intro = true,
    lightMode = false,
    dpr,
    resolution = 0.5,
  } = props;
  const palette = (Array.isArray(colors) && colors.length ? colors : DEFAULT_COLORS).slice(
    0,
    MAX_COLORS,
  );
  return {
    colors: palette.length > 1 ? palette : [palette[0], palette[0]],
    type: TYPES[type] ?? 0,
    angle,
    bands: clamp(bands, 1, 8),
    speed: Math.max(0, speed),
    flow: clamp(flow, 0, 3),
    scale: clamp(scale, 0.25, 3),
    softness: clamp(softness, 0, 1),
    silk: clamp(silk, 0, 1),
    grainAmount: clamp(grainAmount, 0, 0.5),
    grainSize: clamp(grainSize, 0.5, 4),
    grainAnimated,
    contrast: clamp(contrast, 0.2, 2),
    saturation: clamp(saturation, 0, 2),
    variation: Math.max(0, variation),
    interactive,
    stir: clamp(stir, 0, 2),
    clickSwirl,
    intro,
    lightMode,
    dpr,
    resolution: clamp(resolution, 0.25, 1),
  };
}

export type GrainientSettings = ReturnType<typeof resolveSettings>;

type Vec3 = [number, number, number];

/** Convierte #rgb / #rrggbb a RGB 0–1. Cualquier otro formato cae a negro. */
export function parseHex(value: string): Vec3 {
  let hex = value.trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return [0, 0, 0];
  const n = parseInt(hex, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const toLinear = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

/** sRGB → OKLab. */
export function toLab([r, g, b]: Vec3): Vec3 {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * Rampa OKLab plana (MAX_COLORS × 3) para el uniform `uRamp`.
 * En `lightMode` los colores oscuros de base pasan a blanco y los tintes se
 * invierten y aclaran (misma lógica que el original de React Bits).
 */
export function buildRamp(colors: string[], lightMode: boolean): number[] {
  const ramp = new Array<number>(MAX_COLORS * 3).fill(0);
  const labs = colors.map((color) => toLab(parseHex(color)));
  if (!lightMode) {
    labs.forEach((lab, i) => ramp.splice(i * 3, 3, ...lab));
    return ramp;
  }
  const blank = labs.map(([L]) => Math.abs(L - labs[0][0]) < 0.1);
  const tints = labs.filter((_, i) => !blank[i]).reverse();
  labs.forEach((_, i) => {
    const [L, a, b] = blank[i] ? [1, 0, 0] : (tints.shift() ?? [1, 0, 0]);
    ramp.splice(i * 3, 3, L + (1 - L) * LIFT, a * (1 - LIFT), b * (1 - LIFT));
  });
  return ramp;
}
