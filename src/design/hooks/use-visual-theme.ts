import { useColorScheme } from 'react-native';

import { useKioskSettings } from '@/design/settings/kiosk-settings';
import { useThemePreference } from '@/design/theme/visual-theme';
import { glass, palette, type Scheme } from '@/design/tokens';

/**
 * Paleta de la nueva visual según la preferencia de `VisualThemeProvider`
 * ('light' | 'dark' | 'system') y los colores personalizados de Admin → Colores.
 */
export function useVisualTheme() {
  const { preference, setPreference } = useThemePreference();
  const { palette: custom } = useKioskSettings();
  const system: Scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const scheme: Scheme = preference === 'system' ? system : preference;
  return {
    scheme,
    isDark: scheme === 'dark',
    colors: palette[scheme],
    glass: glass[scheme],
    status: custom.status,
    custom,
    preference,
    setPreference,
  };
}
