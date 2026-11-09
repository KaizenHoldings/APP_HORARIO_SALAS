import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/design/components/app-background';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { catalog } from '@/design/lab/catalog';
import { VisualThemeProvider } from '@/design/theme/visual-theme';
import { radius, type Scheme, space, type } from '@/design/tokens';

type SchemeChoice = Scheme | 'system';

const SCHEMES: { id: SchemeChoice; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'system', label: 'Sistema' },
];

/**
 * Laboratorio visual: `/lab`. Parámetros opcionales:
 * `c=<id>` abre un componente y `scheme=light|dark` fuerza el esquema.
 */
export default function LabScreen() {
  const params = useLocalSearchParams<{ c?: string; scheme?: string }>();
  const [scheme, setScheme] = useState<SchemeChoice>(
    params.scheme === 'light' || params.scheme === 'dark' ? params.scheme : 'system',
  );
  const [selectedId, setSelectedId] = useState(
    catalog.some((entry) => entry.id === params.c) ? (params.c as string) : catalog[0]?.id,
  );

  return (
    <VisualThemeProvider scheme={scheme === 'system' ? null : scheme}>
      <AppBackground>
        <LabContent
          scheme={scheme}
          onScheme={setScheme}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </AppBackground>
    </VisualThemeProvider>
  );
}

function LabContent({
  scheme,
  onScheme,
  selectedId,
  onSelect,
}: {
  scheme: SchemeChoice;
  onScheme: (s: SchemeChoice) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const { colors } = useVisualTheme();
  const selected = catalog.find((entry) => entry.id === selectedId);
  const barBg = colors.surface + 'B3';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.toolbar}>
        <View style={[styles.group, { backgroundColor: barBg }]}>
          {catalog.map((entry) => (
            <Chip
              key={entry.id}
              label={entry.title}
              active={entry.id === selectedId}
              onPress={() => onSelect(entry.id)}
            />
          ))}
        </View>
        <View style={[styles.group, { backgroundColor: barBg }]}>
          {SCHEMES.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              active={s.id === scheme}
              onPress={() => onScheme(s.id)}
            />
          ))}
        </View>
      </View>

      {selected ? (
        <ScrollView style={styles.stage} contentContainerStyle={styles.stageContent}>
          <View style={styles.heading}>
            <Text style={[type.title, { color: colors.ink }]}>{selected.title}</Text>
            <Text style={[type.caption, { color: colors.inkSecondary }]}>
              {selected.description} · {selected.status}
            </Text>
          </View>
          <selected.Preview />
        </ScrollView>
      ) : null}
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
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  group: { flexDirection: 'row', gap: space.xs, padding: space.xs, borderRadius: radius.pill },
  chip: {
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    minHeight: 36,
    justifyContent: 'center',
  },
  stage: { flex: 1 },
  stageContent: { flexGrow: 1, padding: space.lg, gap: space.lg },
  heading: { gap: space.xs },
});
