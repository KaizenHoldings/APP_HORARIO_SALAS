import type { TextStyle } from 'react-native';

/**
 * Escala tipográfica de la nueva visual.
 * Los números de reloj y rangos horarios usan cifras tabulares para evitar saltos de ancho.
 */

export const type = {
  display: { fontSize: 56, lineHeight: 60, fontWeight: '800', letterSpacing: -1.7 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.9 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.3 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  clock: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
} as const satisfies Record<string, TextStyle>;

export type TypeKey = keyof typeof type;
