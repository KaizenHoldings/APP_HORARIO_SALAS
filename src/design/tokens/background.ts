import type { GrainientProps } from '@/design/components/grainient';

import type { Scheme } from './colors';

/**
 * Fondo de la app: degradado Grainient (navy → azul → hielo).
 * Oscuro: la rampa tal cual. Claro: la misma rampa en `lightMode` (bases a blanco, tintes aclarados).
 */
const base = {
  colors: ['#120f17', '#0a192a', '#12509a', '#1676f9', '#aadffe'],
  angle: 55,
  flow: 0.8,
  silk: 0.35,
  grainAmount: 0.08,
  speed: 2.35,
  interactive: false,
  clickSwirl: false,
} satisfies GrainientProps;

export const background = {
  dark: { ...base, lightMode: false, fallback: '#120f17' },
  light: { ...base, lightMode: true, fallback: '#FFFFFF' },
} satisfies Record<Scheme, GrainientProps & { fallback: string }>;
