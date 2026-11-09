import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { background, radius, space, type } from '@/design/tokens';

/** El fondo ya se dibuja detrás del laboratorio; aquí solo se muestra su configuración. */
export function BackgroundPreview() {
  const { scheme, colors } = useVisualTheme();
  const { width, height } = useWindowDimensions();
  const config = background[scheme];

  return (
    <View style={styles.root}>
      <View style={[styles.info, { backgroundColor: colors.surface + 'CC' }]}>
        <View style={styles.row}>
          {config.colors.map((c) => (
            <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
          ))}
        </View>
        <Text style={[type.caption, { color: colors.inkSecondary }]}>
          {config.lightMode ? 'lightMode · ' : ''}angle {config.angle} · flow {config.flow} · silk{' '}
          {config.silk} · grain {config.grainAmount} · speed {config.speed}
        </Text>
        <Text style={[type.caption, { color: colors.inkMuted }]}>
          {Math.round(width)}×{Math.round(height)} · {width >= height ? 'horizontal' : 'vertical'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-start' },
  info: { gap: space.sm, padding: space.md, borderRadius: radius.md },
  row: { flexDirection: 'row', gap: space.xs },
  swatch: { width: 24, height: 24, borderRadius: radius.pill },
});
