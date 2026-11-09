import { useColorScheme } from 'react-native';

import { palette, status, type Scheme } from '@/design/tokens';

/**
 * Devuelve la paleta de la nueva visual según el esquema del sistema.
 * Más adelante puede leer la preferencia guardada (`utils/storage`) igual que la pantalla actual.
 */
export function useVisualTheme() {
  const scheme: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, isDark: scheme === 'dark', colors: palette[scheme], status };
}
