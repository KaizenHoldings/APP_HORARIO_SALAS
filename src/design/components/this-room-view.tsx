import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp } from 'react-native-reanimated';

import { DayTimeline } from '@/design/components/day-timeline';
import { RoomClock } from '@/design/components/room-clock';
import { RoomPhoto } from '@/design/components/room-photo';
import { RoomStatusHero } from '@/design/components/room-status-hero';
import { useGutter } from '@/design/hooks/use-gutter';
import { useNow } from '@/design/hooks/use-now';
import { space } from '@/design/tokens';
import type { EventoSala } from '@/types/agenda';
import { getRoomStatus, minutesOfDay, toScheduleBlocks } from '@/utils/room-status';

const EASE = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * Pantalla "Esta sala": estado a la izquierda, hora + foto a la derecha y la línea de tiempo
 * del día abajo. En vertical se apila (estado → foto con hora → línea de tiempo).
 */
export function ThisRoomView({
  roomName,
  eventos,
  photo,
  now: nowOverride,
}: {
  roomName: string;
  eventos: EventoSala[];
  photo: number | { uri: string };
  /** Fija la hora (laboratorio). Sin valor usa el reloj real. */
  now?: Date | null;
}) {
  const now = useNow(nowOverride);
  const { width, height } = useWindowDimensions();
  const landscape = width >= height && width >= 700;
  const gutter = useGutter();

  const blocks = useMemo(() => toScheduleBlocks(eventos), [eventos]);
  const minute = minutesOfDay(now);
  const info = getRoomStatus(blocks, minute);

  return (
    <View style={[styles.root, { paddingHorizontal: gutter }]}>
      <View style={[styles.main, landscape ? styles.row : styles.column]}>
        <View style={[styles.left, !landscape && styles.leftStacked]}>
          <RoomStatusHero roomName={roomName} info={info} />
        </View>

        <View style={[styles.right, !landscape && styles.rightStacked]}>
          <RoomPhoto source={photo} style={[StyleSheet.absoluteFill, styles.photo]} />
          <Animated.View
            entering={FadeIn.duration(700).delay(250)}
            style={[styles.clock, !landscape && styles.clockStacked]}>
            <RoomClock now={now} align="right" />
          </Animated.View>
        </View>
      </View>

      <Animated.View
        entering={FadeInUp.duration(600).delay(300).easing(EASE)}
        style={styles.timeline}>
        <DayTimeline blocks={blocks} now={minute} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingBottom: space.xl },
  main: { flex: 1 },
  row: { flexDirection: 'row', gap: space.xl },
  column: { flexDirection: 'column', gap: space.md },
  left: { flex: 1.05, justifyContent: 'center', paddingRight: space.md },
  // flex explícito: en web `flex: 0` es `flex-basis: 0%` y colapsa la columna.
  leftStacked: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', paddingTop: space.lg, paddingRight: 0 },
  right: { flex: 1 },
  rightStacked: { minHeight: 260 },
  // La foto empieza bajo el reloj para que la hora y la fecha se lean sobre el fondo.
  photo: { top: 96 },
  clock: { position: 'absolute', top: space.md, right: 0 },
  clockStacked: { top: space.lg },
  timeline: { width: '100%', maxWidth: 1040, alignSelf: 'center', paddingTop: space.xl },
});
