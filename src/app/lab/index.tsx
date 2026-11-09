import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { catalog } from '@/design/catalog';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { radius, space, type } from '@/design/tokens';

/** Laboratorio visual: `/lab` (opcionalmente `/lab?c=<id>` para abrir un componente). */
export default function LabScreen() {
  const { colors } = useVisualTheme();
  const { c } = useLocalSearchParams<{ c?: string }>();
  const [selectedId, setSelectedId] = useState(
    catalog.some((entry) => entry.id === c) ? (c as string) : catalog[0]?.id,
  );
  const selected = catalog.find((entry) => entry.id === selectedId);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.canvas }]}>
      <View style={styles.nav}>
        {catalog.map((entry) => {
          const active = entry.id === selectedId;
          return (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              onPress={() => setSelectedId(entry.id)}
              style={[
                styles.chip,
                { backgroundColor: active ? colors.accent : colors.surface },
              ]}>
              <Text
                style={[
                  type.caption,
                  { color: active ? '#FFFFFF' : colors.inkSecondary },
                ]}>
                {entry.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {selected ? (
          <>
            <Text style={[type.title, { color: colors.ink }]}>{selected.title}</Text>
            <Text style={[type.body, { color: colors.inkSecondary }]}>
              {selected.description} · {selected.status}
            </Text>
            <selected.Preview />
          </>
        ) : (
          <Text style={[type.body, { color: colors.inkSecondary }]}>
            El catálogo está vacío.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    minHeight: 36,
    justifyContent: 'center',
  },
  content: { padding: space.lg, gap: space.md },
});
