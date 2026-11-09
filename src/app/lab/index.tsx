import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '@/design/components/app-background';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { catalog, type CatalogEntry } from '@/design/lab/catalog';
import { LabSceneContext } from '@/design/lab/lab-scene';
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
  const params = useLocalSearchParams<{ c?: string; scheme?: string; lab?: string }>();
  // Barra del lab plegable para ver la distribución real de la pantalla (`?lab=0` la abre plegada).
  const [collapsed, setCollapsed] = useState(params.lab === '0');
  const initial =
    params.scheme === 'light' || params.scheme === 'dark' ? params.scheme : 'system';
  const [selectedId, setSelectedId] = useState(
    catalog.some((entry) => entry.id === params.c) ? (params.c as string) : catalog[0]?.id,
  );
  const selected = catalog.find((entry) => entry.id === selectedId);
  const [scene, setScene] = useState<string | null>(selected?.scenes?.[0]?.id ?? null);

  const select = (id: string) => {
    setSelectedId(id);
    setScene(catalog.find((e) => e.id === id)?.scenes?.[0]?.id ?? null);
  };

  return (
    <VisualThemeProvider initial={initial} persist={false}>
      <LabSceneContext.Provider value={scene}>
        <AppBackground>
          {selected ? <Stage entry={selected} collapsed={collapsed} /> : null}
          {collapsed ? (
            <LabHandle onPress={() => setCollapsed(false)} />
          ) : (
            <LabToolbar
              selectedId={selectedId}
              onSelect={select}
              scenes={selected?.scenes}
              scene={scene}
              onScene={setScene}
              onCollapse={() => setCollapsed(true)}
            />
          )}
        </AppBackground>
      </LabSceneContext.Provider>
    </VisualThemeProvider>
  );
}

function Stage({ entry, collapsed }: { entry: CatalogEntry; collapsed: boolean }) {
  const { colors } = useVisualTheme();
  if (entry.layout === 'screen') {
    return (
      // Deja libre la franja inferior para la barra del laboratorio.
      <View style={[styles.screenStage, collapsed && styles.screenStageFull]} pointerEvents="box-none">
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
  scenes,
  scene,
  onScene,
  onCollapse,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
  scenes?: { id: string; label: string }[];
  scene: string | null;
  onScene: (id: string) => void;
  onCollapse: () => void;
}) {
  const { colors, preference, setPreference } = useVisualTheme();
  const barBg = colors.surface + 'D9';

  return (
    <SafeAreaView edges={['bottom']} style={styles.toolbarWrap} pointerEvents="box-none">
      <Animated.View
        entering={FadeInDown.duration(320).easing(Easing.bezier(0.23, 1, 0.32, 1))}
        exiting={FadeOutDown.duration(180)}
        style={[styles.toolbar, { backgroundColor: barBg }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Plegar laboratorio"
          onPress={onCollapse}
          style={styles.collapse}>
          <Ionicons name="chevron-down" size={18} color={colors.inkSecondary} />
        </Pressable>
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
        {scenes?.length ? (
          <>
            <View style={[styles.divider, { backgroundColor: colors.inkMuted }]} />
            {scenes.map((s) => (
              <Chip key={s.id} label={s.label} active={s.id === scene} onPress={() => onScene(s.id)} />
            ))}
          </>
        ) : null}
      </Animated.View>
    </SafeAreaView>
  );
}

/** Botón pequeño que queda al plegar el laboratorio. */
function LabHandle({ onPress }: { onPress: () => void }) {
  const { colors } = useVisualTheme();
  return (
    <SafeAreaView edges={['bottom', 'left']} style={styles.handleWrap} pointerEvents="box-none">
      <Animated.View entering={FadeInDown.duration(260)} exiting={FadeOutDown.duration(160)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir laboratorio"
          onPress={onPress}
          style={[styles.handle, { backgroundColor: colors.surface + '99' }]}>
          <Ionicons name="flask-outline" size={16} color={colors.inkSecondary} />
        </Pressable>
      </Animated.View>
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
  screenStage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 72 },
  screenStageFull: { bottom: 0 },
  collapse: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleWrap: { position: 'absolute', left: 0, bottom: 0 },
  handle: {
    width: 32,
    height: 32,
    margin: space.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
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
