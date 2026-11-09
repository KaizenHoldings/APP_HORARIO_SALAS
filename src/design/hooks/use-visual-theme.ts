import { useColorScheme } from 'react-native';

import { useSchemeOverride } from '@/design/theme/visual-theme';
import { palette, status, type Scheme } from '@/design/tokens';

/**
 * Paleta de la nueva visual. Usa el esquema forzado por `VisualThemeProvider`
 * (laboratorio, preferencia guardada) o, si no hay, el del sistema.
 */
export function useVisualTheme() {
  const override = useSchemeOverride();
  const system: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const scheme = override ?? system;
  return { scheme, isDark: scheme === 'dark', colors: palette[scheme], status };
}
