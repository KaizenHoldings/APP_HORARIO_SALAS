import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Grainient } from '@/design/components/grainient';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { background } from '@/design/tokens';

/**
 * Fondo base de todas las pantallas: Grainient a pantalla completa según el esquema
 * claro/oscuro, con el contenido encima. Se adapta solo a cambios de tamaño u orientación.
 */
export function AppBackground({
  children,
  style,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { scheme } = useVisualTheme();
  const { fallback, ...grainient } = background[scheme];

  return (
    <View style={[styles.root, { backgroundColor: fallback }, style]}>
      <Grainient {...grainient} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
});
