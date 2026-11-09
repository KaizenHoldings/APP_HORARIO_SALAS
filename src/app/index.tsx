import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppBackground } from '@/design/components/app-background';
import { AppFrame } from '@/design/components/app-frame';
import { GlassSurface } from '@/design/components/glass-surface';
import { OtherRoomsView } from '@/design/components/other-rooms-view';
import { ThisRoomView } from '@/design/components/this-room-view';
import { useNow } from '@/design/hooks/use-now';
import { type RoomsStatus, useRooms } from '@/design/hooks/use-rooms';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { resolvePhoto } from '@/design/room-photos';
import { KioskSettingsProvider, roomMetaOf, useKioskSettings } from '@/design/settings/kiosk-settings';
import { VisualThemeProvider } from '@/design/theme/visual-theme';
import { font, space } from '@/design/tokens';
import { getRoomStatus, minutesOfDay, statusLine } from '@/utils/room-status';

/**
 * Pantalla del kiosco de la sala.
 * Datos: backend de salas (EXPO_PUBLIC_API_URL / EXPO_PUBLIC_API_KEY), refresco cada minuto.
 * Ajustes de la tablet (sala, marca, fotos, equipamiento, colores): Admin, guardados en el equipo.
 */
export default function HomeScreen() {
  return (
    <VisualThemeProvider>
      <KioskSettingsProvider>
        <AppBackground>
          <KioskScreen />
        </AppBackground>
      </KioskSettingsProvider>
    </VisualThemeProvider>
  );
}

const NOTICE: Partial<Record<RoomsStatus, string>> = {
  offline: 'Sin conexión con el servidor · se muestra la última agenda disponible',
  unconfigured: 'Falta configurar la conexión con el servidor (EXPO_PUBLIC_API_URL)',
};

function KioskScreen() {
  const { isDark } = useVisualTheme();
  const { rooms, status } = useRooms();
  const { settings } = useKioskSettings();
  const now = useNow();
  const minute = minutesOfDay(now);

  const selected = settings.roomEmail?.toLowerCase();
  const current = rooms.find((r) => r.email.toLowerCase() === selected) ?? rooms[0] ?? null;

  const otherRooms = rooms
    .filter((r) => r !== current)
    .map((r) => {
      const info = getRoomStatus(r.blocks, minute);
      const meta = roomMetaOf(settings, r.email);
      return {
        email: r.email,
        name: r.name,
        photo: resolvePhoto(meta.photo),
        state: info.state,
        line: statusLine(info),
        capacity: meta.capacity,
        equipment: meta.equipment,
      };
    });

  const adminRooms = rooms.map((r) => ({
    email: r.email,
    name: r.name,
    state: getRoomStatus(r.blocks, minute).state,
  }));

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppFrame
        adminRooms={adminRooms}
        renderView={(view) => {
          if (view === 'others') return <OtherRoomsView rooms={otherRooms} />;
          if (!current) return <StatusMessage status={status} />;
          return (
            <ThisRoomView
              roomName={current.name}
              blocks={current.blocks}
              photo={resolvePhoto(roomMetaOf(settings, current.email).photo)}
              notice={NOTICE[status] ?? null}
            />
          );
        }}
      />
    </>
  );
}

/** Sin datos todavía: cargando o sin conexión (nunca se muestra un estado inventado). */
function StatusMessage({ status }: { status: RoomsStatus }) {
  const { colors } = useVisualTheme();
  const loading = status === 'loading';
  return (
    <View style={styles.center}>
      <Animated.View entering={FadeIn.duration(500)}>
        <GlassSurface strong radius={28} contentStyle={styles.card}>
          {loading ? <ActivityIndicator color={colors.ink} /> : null}
          <Text style={[styles.title, { color: colors.ink }]}>
            {loading ? 'Cargando la agenda…' : 'Sin conexión con el servidor'}
          </Text>
          <Text style={[styles.body, { color: colors.inkSecondary }]}>
            {loading
              ? 'Consultando las salas del sistema.'
              : (NOTICE[status] ?? 'Se reintentará automáticamente cada minuto.')}
          </Text>
        </GlassSurface>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl, paddingHorizontal: 40, maxWidth: 520 },
  title: { fontSize: 24, ...font.regular, textAlign: 'center' },
  body: { fontSize: 15, ...font.regular, textAlign: 'center' },
});
