import { type StyleProp, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import { BrandMark } from '@/design/components/brand-mark';
import { GlassIconButton } from '@/design/components/glass-icon-button';
import { SegmentedSwitch } from '@/design/components/segmented-switch';
import { useGutter } from '@/design/hooks/use-gutter';
import { space } from '@/design/tokens';

export type RoomView = 'this' | 'others';

const VIEW_OPTIONS: { id: RoomView; label: string }[] = [
  { id: 'this', label: 'Esta sala' },
  { id: 'others', label: 'Otras salas' },
];

const enter = (i: number) =>
  FadeInDown.duration(560)
    .delay(120 + i * 90)
    .easing(Easing.bezier(0.23, 1, 0.32, 1));

/**
 * Barra superior flotante: isotipo (Admin → Marca) a la izquierda, switch "Esta sala / Otras
 * salas" centrado y botón de ajustes a la derecha, alineados a la retícula (useGutter).
 * Los laterales ocupan lo mismo para que el switch quede siempre centrado.
 */
export function Navbar({
  view,
  onViewChange,
  menuOpen,
  onMenuPress,
  style,
}: {
  view: RoomView;
  onViewChange: (next: RoomView) => void;
  menuOpen: boolean;
  onMenuPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 480;
  const segmentWidth = compact ? 112 : 136;
  const gutter = useGutter();

  return (
    <View
      style={[styles.bar, { paddingHorizontal: gutter }, compact && styles.barCompact, style]}
      accessibilityRole="header"
      pointerEvents="box-none">
      <Animated.View entering={enter(0)} style={styles.side}>
        <BrandMark size={44} />
      </Animated.View>

      <Animated.View entering={enter(1)} style={styles.center}>
        <SegmentedSwitch
          options={VIEW_OPTIONS}
          value={view}
          onChange={onViewChange}
          segmentWidth={segmentWidth}
          accessibilityLabel="Cambiar de pantalla"
        />
      </Animated.View>

      <Animated.View entering={enter(2)} style={[styles.side, styles.end]}>
        <GlassIconButton
          icon="settings-outline"
          accessibilityLabel={menuOpen ? 'Cerrar ajustes' : 'Abrir ajustes'}
          rotation={menuOpen ? 90 : 0}
          onPress={onMenuPress}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingTop: space.xl,
    paddingBottom: space.md,
  },
  barCompact: { gap: space.sm },
  side: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  end: { alignItems: 'flex-end' },
  center: { alignItems: 'center' },
});
