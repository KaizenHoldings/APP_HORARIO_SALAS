import { useColorScheme } from 'react-native';

import { useThemePreference } from '@/design/theme/visual-theme';
import { glass, palette, status, type Scheme } from '@/design/tokens';

/**
 * Paleta de la nueva visual según la preferencia de `VisualThemeProvider`
 * ('light' | 'dark' | 'system').
 */
export function useVisualTheme() {
  const { preference, setPreference } = useThemePreference();
  const system: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const scheme: Scheme = preference === 'system' ? system : preference;
  return {
    scheme,
    isDark: scheme === 'dark',
    colors: palette[scheme],
    glass: glass[scheme],
    status,
    preference,
    setPreference,
  };
}
