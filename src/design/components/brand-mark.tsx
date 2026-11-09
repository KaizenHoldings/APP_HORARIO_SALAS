import { SvgXml } from 'react-native-svg';

import { type Brand, brandById } from '@/design/brands';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { useKioskSettings } from '@/design/settings/kiosk-settings';

/** Isotipo de la marca elegida en Admin → Marca (versión blanca en modo oscuro). */
export function BrandMark({ size = 44, brand }: { size?: number; brand?: Brand }) {
  const { isDark } = useVisualTheme();
  const { settings } = useKioskSettings();
  const b = brand ?? brandById(settings.brand);
  return (
    <SvgXml
      xml={isDark ? b.white : b.color}
      width={size * b.aspect}
      height={size}
      accessibilityRole="image"
      accessibilityLabel={b.name}
    />
  );
}
