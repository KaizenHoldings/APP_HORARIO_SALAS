import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FeatureCarousel,
  DEFAULT_AGENDA_ITEMS,
  AgendaCardItem,
} from '@/components/feature-carousel';

export default function ComponenteScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <FeatureCarousel items={DEFAULT_AGENDA_ITEMS} panelTitle="Demostración de Sala" />
      </ScrollView>
    </SafeAreaView>
  );
}

export { FeatureCarousel, DEFAULT_AGENDA_ITEMS };
export type { AgendaCardItem };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C14',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
});
