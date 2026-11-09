import { StyleSheet, Text, View } from 'react-native';

import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { radius, space, status, type } from '@/design/tokens';

/** Muestra los tokens vigentes de la nueva visual (colores, estados y tipografía). */
export function TokensPreview() {
  const { colors, isDark } = useVisualTheme();

  const swatches = Object.entries(colors).filter(([, v]) => !v.startsWith('rgba'));
  const statusSwatches = Object.entries(status).map(
    ([key, v]) => [key, v.main] as const,
  );

  return (
    <View style={styles.root}>
      <Text style={[type.caption, { color: colors.inkMuted }]}>COLORES</Text>
      <View style={styles.row}>
        {[...swatches, ...statusSwatches].map(([name, value]) => (
          <View key={name} style={styles.swatchWrap}>
            <View
              style={[
                styles.swatch,
                { backgroundColor: value, borderColor: colors.hairline },
              ]}
            />
            <Text style={[type.caption, { color: colors.inkSecondary }]}>{name}</Text>
          </View>
        ))}
      </View>

      <Text style={[type.caption, { color: colors.inkMuted }]}>TIPOGRAFÍA</Text>
      {(Object.keys(type) as (keyof typeof type)[]).map((key) => (
        <Text key={key} style={[type[key], { color: colors.ink }]}>
          {key} · {key === 'clock' ? '10:45:32' : 'Sala SOCADO'}
        </Text>
      ))}

      <Text style={[type.caption, { color: colors.inkMuted }]}>
        ESQUEMA: {isDark ? 'oscuro' : 'claro'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  swatchWrap: { alignItems: 'center', gap: space.xs },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
