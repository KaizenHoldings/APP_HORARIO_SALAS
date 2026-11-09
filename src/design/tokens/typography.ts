import {
  Raleway_300Light,
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
} from '@expo-google-fonts/raleway';
import type { TextStyle } from 'react-native';

/**
 * Tipografía de la nueva visual: Raleway, pesos finos (minimalista).
 *
 * En Android cada peso de una fuente propia es una familia distinta, así que el peso se
 * elige con `font.light | regular | medium | semibold` (fontFamily), no con fontWeight.
 * Raleway trae cifras "de estilo antiguo"; `numbers` activa cifras alineadas y tabulares.
 */
export const FONT_FILES = {
  Raleway_300Light,
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
};

export const font = {
  light: { fontFamily: 'Raleway_300Light', fontWeight: 'normal' },
  regular: { fontFamily: 'Raleway_400Regular', fontWeight: 'normal' },
  medium: { fontFamily: 'Raleway_500Medium', fontWeight: 'normal' },
  semibold: { fontFamily: 'Raleway_600SemiBold', fontWeight: 'normal' },
} as const satisfies Record<string, TextStyle>;

export const numbers = { fontVariant: ['lining-nums', 'tabular-nums'] } as const satisfies TextStyle;

export const type = {
  display: { fontSize: 56, lineHeight: 62, ...font.light, letterSpacing: -1 },
  title: { fontSize: 32, lineHeight: 38, ...font.regular, letterSpacing: -0.4 },
  heading: { fontSize: 20, lineHeight: 26, ...font.medium, letterSpacing: -0.1 },
  body: { fontSize: 16, lineHeight: 22, ...font.regular },
  caption: { fontSize: 13, lineHeight: 18, ...font.medium },
  clock: { fontSize: 40, lineHeight: 44, ...font.light, letterSpacing: -1, ...numbers },
} as const satisfies Record<string, TextStyle>;

export type TypeKey = keyof typeof type;
