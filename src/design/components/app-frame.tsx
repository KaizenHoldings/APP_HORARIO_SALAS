import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Navbar, type RoomView } from '@/design/components/navbar';
import { SettingsDrawer } from '@/design/components/settings-drawer';

/**
 * Armazón de pantalla de la nueva visual: Navbar arriba, contenido de la vista activa
 * (con fundido al cambiar) y el menú de ajustes por encima de todo.
 * Va dentro de `AppBackground`.
 */
export function AppFrame({
  renderView,
  initialView = 'this',
  onAdminUnlocked,
}: {
  renderView: (view: RoomView) => ReactNode;
  initialView?: RoomView;
  onAdminUnlocked?: () => void;
}) {
  const [view, setView] = useState<RoomView>(initialView);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.root} pointerEvents="box-none">
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']} pointerEvents="box-none">
        <Navbar
          view={view}
          onViewChange={setView}
          menuOpen={menuOpen}
          onMenuPress={() => setMenuOpen((o) => !o)}
        />
        <Animated.View
          key={view}
          entering={FadeIn.duration(320)}
          exiting={FadeOut.duration(160)}
          pointerEvents="box-none"
          style={styles.content}>
          {renderView(view)}
        </Animated.View>
      </SafeAreaView>
      <SettingsDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAdminUnlocked={onAdminUnlocked}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
