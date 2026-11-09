import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeInUp } from 'react-native-reanimated';

import { DayTimeline } from '@/design/components/day-timeline';
import { PhotoCard } from '@/design/components/photo-card';
import { RoomStatusHero } from '@/design/components/room-status-hero';
import { useGutter } from '@/design/hooks/use-gutter';
import { useNow } from '@/design/hooks/use-now';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import type { PhotoSource } from '@/design/room-photos';
import { font, space } from '@/design/tokens';
import { getRoomStatus, minutesOfDay, type ScheduleBlock } from '@/utils/room-status';

const EASE = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Pantalla "Esta sala" (retícula simétrica):
 * - horizontal: nombre y estado a la izquierda, foto 16:9 con la hora a la derecha, centrados
 *   verticalmente entre la navbar y la línea de tiempo;
 * - vertical: nombre y estado, foto a todo el ancho y línea de tiempo abajo.
 */
export function ThisRoomView({
  roomName,
  blocks,
  photo,
  now: nowOverride,
  notice,
}: {
  roomName: string;
  blocks: ScheduleBlock[];
  photo: PhotoSource;
  /** Fija la hora (laboratorio). Sin valor usa el reloj real. */
  now?: Date | null;
  /** Aviso discreto (sin conexión, etc.). */
  notice?: string | null;
}) {
  const now = useNow(nowOverride);
  const { colors } = useVisualTheme();
  const { width, height } = useWindowDimensions();
  const gutter = useGutter();
  const landscape = width >= height && width >= 700;

  const minute = minutesOfDay(now);
  const info = getRoomStatus(blocks, minute);

  // Foto 16:9: en horizontal ocupa ~61 % de la columna; en vertical, todo el ancho.
  const columnWidth = width - gutter * 2;
  const photoWidth = landscape ? Math.round(columnWidth * 0.615) : columnWidth;
  const photoHeight = Math.round((photoWidth * 9) / 16);

  return (
    <View style={[styles.root, { paddingHorizontal: gutter }]}>
      <View style={[styles.main, landscape ? styles.row : styles.column]}>
        <View style={landscape ? styles.heroSide : styles.heroTop}>
          <RoomStatusHero roomName={roomName} info={info} />
          {notice ? (
            <Text style={[styles.notice, { color: colors.inkMuted }]}>{notice}</Text>
          ) : null}
        </View>
        <PhotoCard source={photo} now={now} style={{ width: photoWidth, height: photoHeight }} />
      </View>

      <Animated.View entering={FadeInUp.duration(600).delay(300).easing(EASE)}>
        <DayTimeline blocks={blocks} now={minute} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingBottom: space.xl },
  main: { flex: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 48 },
  column: { flexDirection: 'column', gap: 48 },
  heroSide: { flex: 1, minWidth: 0 },
  heroTop: {},
  notice: { marginTop: space.md, fontSize: 13, ...font.regular },
});
