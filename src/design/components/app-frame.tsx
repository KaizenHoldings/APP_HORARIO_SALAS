import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Navbar, type RoomView } from '@/design/components/navbar';
import type { AdminRoomInfo } from '@/design/components/admin-console';
import { SettingsDrawer } from '@/design/components/settings-drawer';

/** Sin toques durante este tiempo, la pantalla vuelve a "Esta sala" y cierra el menú. */
export const IDLE_RETURN_MS = 30_000;

/**
 * Armazón de pantalla de la nueva visual: Navbar arriba, contenido de la vista activa
 * (con fundido al cambiar) y el menú de ajustes por encima de todo.
 * Tras `IDLE_RETURN_MS` sin actividad vuelve a "Esta sala" (kiosco).
 * Va dentro de `AppBackground`.
 */
export function AppFrame({
  renderView,
  initialView = 'this',
  onAdminUnlocked,
  adminRooms,
}: {
  renderView: (view: RoomView) => ReactNode;
  initialView?: RoomView;
  onAdminUnlocked?: () => void;
  /** Salas del sistema para la consola de administración. */
  adminRooms?: AdminRoomInfo[];
}) {
  const [view, setView] = useState<RoomView>(initialView);
  const [menuOpen, setMenuOpen] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const armIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setView('this');
      setMenuOpen(false);
    }, IDLE_RETURN_MS);
  }, []);

  useEffect(() => {
    armIdle();
    return () => clearTimeout(idleTimer.current);
  }, [armIdle]);

  return (
    <View
      style={styles.root}
      // Recibe también los toques en zonas vacías; en fase de captura ve cada toque
      // sin quitárselo a los botones (devuelve false).
      onStartShouldSetResponderCapture={() => {
        armIdle();
        return false;
      }}>
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
        rooms={adminRooms}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
});
