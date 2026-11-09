import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/design/components/app-background';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { catalog, type CatalogEntry } from '@/design/lab/catalog';
import { type ThemePreference, VisualThemeProvider } from '@/design/theme/visual-theme';
import { radius, space, type } from '@/design/tokens';

const SCHEMES: { id: ThemePreference; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'system', label: 'Sistema' },
];

/**
 * Laboratorio visual: `/lab`. Parámetros opcionales:
 * `c=<id>` abre un componente y `scheme=light|dark` fija el esquema inicial.
 * El tema del laboratorio no se guarda (no altera la preferencia de la tablet).
 */
export default function LabScreen() {
  const params = useLocalSearchParams<{ c?: string; scheme?: string }>();
  const initial =
    params.scheme === 'light' || params.scheme === 'dark' ? params.scheme : 'system';
  const [selectedId, setSelectedId] = useState(
    catalog.some((entry) => entry.id === params.c) ? (params.c as string) : catalog[0]?.id,
  );
  const selected = catalog.find((entry) => entry.id === selectedId);
  const toolbar = <LabToolbar selectedId={selectedId} onSelect={setSelectedId} />;

  return (
    <VisualThemeProvider initial={initial} persist={false}>
      <AppBackground>
        {/* En vistas de pantalla completa la barra del lab queda debajo (el menú lateral la tapa). */}
        {selected?.layout === 'screen' ? toolbar : null}
        {selected ? <Stage entry={selected} /> : null}
        {selected?.layout !== 'screen' ? toolbar : null}
      </AppBackground>
    </VisualThemeProvider>
  );
}

function Stage({ entry }: { entry: CatalogEntry }) {
  const { colors } = useVisualTheme();
  if (entry.layout === 'screen') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <entry.Preview key={entry.id} />
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.stageContent}>
        <View style={styles.heading}>
          <Text style={[type.title, { color: colors.ink }]}>{entry.title}</Text>
          <Text style={[type.caption, { color: colors.inkSecondary }]}>
            {entry.description} · {entry.status}
          </Text>
        </View>
        <entry.Preview key={entry.id} />
      </ScrollView>
    </SafeAreaView>
  );
}

function LabToolbar({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const { colors, preference, setPreference } = useVisualTheme();
  const barBg = colors.surface + 'D9';

  return (
    <SafeAreaView edges={['bottom']} style={styles.toolbarWrap} pointerEvents="box-none">
      <View style={[styles.toolbar, { backgroundColor: barBg }]}>
        <Text style={[type.caption, styles.labTag, { color: colors.inkMuted }]}>LAB</Text>
        {catalog.map((entry) => (
          <Chip
            key={entry.id}
            label={entry.title}
            active={entry.id === selectedId}
            onPress={() => onSelect(entry.id)}
          />
        ))}
        <View style={[styles.divider, { backgroundColor: colors.inkMuted }]} />
        {SCHEMES.map((s) => (
          <Chip
            key={s.id}
            label={s.label}
            active={s.id === preference}
            onPress={() => setPreference(s.id)}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useVisualTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: colors.accent }]}>
      <Text style={[type.caption, { color: active ? '#FFFFFF' : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stageContent: { flexGrow: 1, padding: space.lg, paddingBottom: 96, gap: space.lg },
  heading: { gap: space.xs },
  toolbarWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space.xs,
    padding: space.xs,
    margin: space.md,
    borderRadius: radius.pill,
  },
  labTag: { paddingHorizontal: space.sm, letterSpacing: 1.5 },
  divider: { width: StyleSheet.hairlineWidth, height: 20, marginHorizontal: space.xs, opacity: 0.5 },
  chip: {
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    minHeight: 34,
    justifyContent: 'center',
  },
});
