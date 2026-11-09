import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  FadeOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { LegendItem } from '@/design/components/day-timeline';
import { GlassSurface } from '@/design/components/glass-surface';
import { RoomCard, type RoomCardData, ROOM_CARD_WIDTH } from '@/design/components/room-card';
import { useGutter } from '@/design/hooks/use-gutter';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { font, space } from '@/design/tokens';

const GAP = 24;
const EASE = Easing.bezier(0.23, 1, 0.32, 1);

/**
 * "Otras salas": una fila de tarjetas que se arrastra a izquierda/derecha y se ajusta a cada
 * tarjeta al soltar. Debajo, un aviso con una mano animada que desaparece al primer arrastre.
 */
export function OtherRoomsView({ rooms }: { rooms: RoomCardData[] }) {
  const { colors, status } = useVisualTheme();
  const gutter = useGutter();
  const { width, height } = useWindowDimensions();
  const landscape = width >= height && width >= 700;
  const [dragged, setDragged] = useState(false);

  const available = rooms.filter((r) => r.state === 'available').length;
  const summary = `${rooms.length} ${rooms.length === 1 ? 'sala' : 'salas'} · ${available} ${
    available === 1 ? 'disponible' : 'disponibles'
  } ahora`;

  return (
    <View style={[styles.root, !landscape && styles.rootPortrait]}>
      <View
        style={[
          styles.head,
          { paddingHorizontal: gutter },
          !landscape && styles.headPortrait,
        ]}>
        <View>
          <Text style={[styles.title, { color: colors.ink }]}>Otras salas</Text>
          <Text style={[styles.summary, { color: colors.inkSecondary }]}>{summary}</Text>
        </View>
        <View style={styles.legend}>
          <LegendItem solid={status.available.main} label="Disponible" />
          <LegendItem solid={status.soon.main} label="Por ocuparse" />
          <LegendItem solid={status.occupied.main} label="Ocupada" />
        </View>
      </View>

      {rooms.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ROOM_CARD_WIDTH + GAP}
          decelerationRate="fast"
          contentContainerStyle={[styles.rail, { paddingHorizontal: gutter }]}
          onScrollBeginDrag={() => setDragged(true)}>
          {rooms.map((room, i) => (
            <Animated.View key={room.email} entering={FadeInUp.duration(600).delay(120 + i * 90).easing(EASE)}>
              <RoomCard room={room} />
            </Animated.View>
          ))}
        </ScrollView>
      ) : (
        <Text style={[styles.empty, { color: colors.inkSecondary, paddingHorizontal: gutter }]}>
          No hay otras salas en el sistema.
        </Text>
      )}

      {!dragged && rooms.length > 1 ? (
        <Animated.View exiting={FadeOutDown.duration(400)} style={styles.hintWrap} pointerEvents="none">
          <GlassSurface radius={999} contentStyle={styles.hint}>
            <Hand color={colors.ink} />
            <Text style={[styles.hintText, { color: colors.ink }]}>
              Desliza las tarjetas para ver más salas
            </Text>
          </GlassSurface>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Hand({ color }: { color: string }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    t.set(withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [reduce, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: -10 + 20 * t.value }, { rotate: `${-10 + 18 * t.value}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 11V6a2 2 0 0 0-4 0" />
        <Path d="M14 10V4a2 2 0 0 0-4 0v2" />
        <Path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
        <Path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: space.lg, paddingBottom: space.xl },
  rootPortrait: { justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: space.md },
  headPortrait: { flexDirection: 'column', alignItems: 'flex-start', gap: space.md },
  title: { fontSize: 40, lineHeight: 46, ...font.light, letterSpacing: -0.5 },
  summary: { fontSize: 15, ...font.regular, marginTop: 4 },
  legend: { flexDirection: 'row', gap: 20, marginBottom: 6 },
  rail: { gap: GAP, paddingVertical: 12 },
  empty: { fontSize: 16, ...font.regular, paddingVertical: space.xl },
  hintWrap: { alignSelf: 'center', marginTop: space.md },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 18 },
  hintText: { fontSize: 14, ...font.regular },
});
