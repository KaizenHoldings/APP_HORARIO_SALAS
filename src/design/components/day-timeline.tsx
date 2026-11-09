import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GlassSurface } from '@/design/components/glass-surface';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { space } from '@/design/tokens';
import { formatDuration, formatMinutes, type ScheduleBlock } from '@/utils/room-status';

const BAR = 10;
const BAR_ACTIVE = 14;
const HIT = 44;
const GAP = 10;
const CARD_W = 300;
const HEADER_H = 48;
const AUTO_CLOSE_MS = 8000;
const EASE = Easing.bezier(0.23, 1, 0.32, 1);
const GROW = { damping: 15, stiffness: 260, mass: 0.7 };

/** Degradados de relleno: pasado (lavanda → azul, "completado") y bloque en curso por estado. */
const FILL = {
  past: ['#C4B5FD', '#60A5FA'] as const,
  busy: ['#FF8A80', '#FF3B30'] as const,
  free: ['#86EFAC', '#22C55E'] as const,
};

const shortTime = (m: number) => formatMinutes(m).replace(/ (AM|PM)$/, '');

/**
 * Línea de tiempo del día, estilo barras de progreso (ref. en docs/visual/concept.md):
 * - una píldora por bloque, con ancho proporcional a su duración;
 * - lo pasado, lleno en degradado; el bloque actual se llena hasta "ahora" en el color
 *   de su estado; lo que viene es pista gris (libre) o roja translúcida (reservado);
 * - al tocar un bloque crece y aparece una tarjeta de vidrio con quién reservó y a qué hora.
 */
export function DayTimeline({
  blocks,
  now,
  style,
}: {
  blocks: ScheduleBlock[];
  /** Minutos desde las 00:00. */
  now: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useVisualTheme();
  const [width, setWidth] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    const t = setTimeout(() => setSelectedId(null), AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [selectedId]);

  if (!blocks.length) return null;

  const dayStart = blocks[0].start;
  const dayEnd = blocks[blocks.length - 1].end;
  const span = Math.max(1, dayEnd - dayStart);
  // Reparte el ancho descontando los huecos entre píldoras.
  const usable = Math.max(0, width - GAP * (blocks.length - 1));
  const lefts: number[] = [];
  let acc = 0;
  for (const b of blocks) {
    lefts.push(acc);
    acc += ((b.end - b.start) / span) * usable + GAP;
  }
  const widthOf = (b: ScheduleBlock) => ((b.end - b.start) / span) * usable;
  const xOf = (m: number) => {
    const i = blocks.findIndex((b) => m >= b.start && m <= b.end);
    if (i < 0) return m < dayStart ? 0 : width;
    return lefts[i] + ((m - blocks[i].start) / (blocks[i].end - blocks[i].start)) * widthOf(blocks[i]);
  };

  const meetings = blocks.filter((b) => b.busy).length;
  const nowInRange = now >= dayStart && now <= dayEnd;
  const selectedIndex = blocks.findIndex((b) => b.id === selectedId);
  const selected = selectedIndex >= 0 ? blocks[selectedIndex] : null;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (Math.abs(w - width) > 0.5) setWidth(w);
  };

  return (
    <View style={[styles.root, style]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => setSelectedId(null)}
        accessible={false}
      />

      <View style={styles.header} pointerEvents="none">
        <View style={[styles.tile, { backgroundColor: colors.ink + '14' }]}>
          <Ionicons name="calendar" size={20} color={colors.ink} />
        </View>
        <View style={styles.headerCenter}>
          <Ionicons name="time-outline" size={18} color={colors.ink} />
          <Text style={[styles.headerTitle, { color: colors.ink }]}>Agenda de hoy</Text>
        </View>
        <Text style={[styles.headerRight, { color: colors.ink }]}>
          {meetings === 0 ? 'Sin reuniones' : `${meetings} ${meetings === 1 ? 'reunión' : 'reuniones'}`}
        </Text>
      </View>

      <View style={styles.trackArea} onLayout={onLayout}>
        {width > 0
          ? blocks.map((block, i) => (
              <Segment
                key={block.id}
                block={block}
                index={i}
                left={lefts[i]}
                width={Math.max(4, widthOf(block))}
                now={now}
                selected={block.id === selectedId}
                dimmed={selectedId !== null && block.id !== selectedId}
                onPress={() => setSelectedId((id) => (id === block.id ? null : block.id))}
              />
            ))
          : null}

        {width > 0 && nowInRange ? (
          <Animated.View
            entering={FadeIn.duration(500).delay(900)}
            pointerEvents="none"
            style={[styles.now, { left: xOf(now) - 28 }]}>
            <Text style={[styles.nowLabel, { color: colors.ink }]}>{shortTime(now)}</Text>
          </Animated.View>
        ) : null}

        {selected && width > 0 ? (
          <DetailCard
            key={selected.id}
            block={selected}
            left={Math.min(
              Math.max(0, lefts[selectedIndex] + widthOf(selected) / 2 - CARD_W / 2),
              Math.max(0, width - CARD_W),
            )}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </View>

      <View style={styles.ends} pointerEvents="none">
        <Text style={[styles.endLabel, { color: colors.inkMuted }]}>{formatMinutes(dayStart)}</Text>
        <Text style={[styles.endLabel, { color: colors.inkMuted }]}>{formatMinutes(dayEnd)}</Text>
      </View>
    </View>
  );
}

function Segment({
  block,
  index,
  left,
  width,
  now,
  selected,
  dimmed,
  onPress,
}: {
  block: ScheduleBlock;
  index: number;
  left: number;
  width: number;
  now: number;
  selected: boolean;
  dimmed: boolean;
  onPress: () => void;
}) {
  const { colors, status } = useVisualTheme();
  const reduce = useReducedMotion();
  const thickness = useSharedValue(BAR);
  const progress = Math.min(1, Math.max(0, (now - block.start) / (block.end - block.start)));
  const isPast = progress >= 1;
  const fillRatio = useSharedValue(reduce ? progress : 0);

  useEffect(() => {
    thickness.set(withSpring(selected ? BAR_ACTIVE : BAR, GROW));
  }, [selected, thickness]);

  // El relleno "carga" al entrar y avanza con el reloj.
  useEffect(() => {
    fillRatio.set(
      reduce ? progress : withDelay(300 + index * 90, withTiming(progress, { duration: 700, easing: EASE })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    height: thickness.value,
    borderRadius: thickness.value / 2,
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${fillRatio.value * 100}%` }));

  const track = block.busy
    ? { backgroundColor: status.occupied.main, opacity: 0.45 }
    : { backgroundColor: colors.ink, opacity: 0.12 };
  const gradient = isPast ? FILL.past : block.busy ? FILL.busy : FILL.free;
  const label = block.busy
    ? `${block.title}, ${formatMinutes(block.start)} a ${formatMinutes(block.end)}`
    : `Libre de ${formatMinutes(block.start)} a ${formatMinutes(block.end)}`;

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(200 + index * 60)}
      style={[
        styles.segment,
        { left, width, opacity: dimmed ? 0.4 : 1 },
        { transitionProperty: 'opacity', transitionDuration: 220 },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={styles.hit}>
        <Animated.View style={[styles.bar, barStyle]}>
          {!isPast ? <View style={[StyleSheet.absoluteFill, track]} /> : null}
          <Animated.View style={[styles.fill, fillStyle]}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function DetailCard({
  block,
  left,
  onClose,
}: {
  block: ScheduleBlock;
  left: number;
  onClose: () => void;
}) {
  const { colors, status, isDark } = useVisualTheme();
  const tone = block.busy ? status.occupied : status.available;
  const ink = isDark ? tone.textDark : tone.textLight;
  const range = `${formatMinutes(block.start)} – ${formatMinutes(block.end)}`;
  const duration = formatDuration(block.end - block.start);

  return (
    <Animated.View
      entering={FadeInDown.duration(380).easing(EASE)}
      exiting={FadeOut.duration(140)}
      style={[styles.card, { left }]}>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar detalle">
        <GlassSurface strong radius={20} contentStyle={styles.cardContent}>
          <View style={styles.cardHead}>
            <View style={[styles.cardDot, { backgroundColor: tone.main }]} />
            <Text style={[styles.cardState, { color: ink }]}>
              {block.busy ? 'Ocupada' : 'Disponible'}
            </Text>
            <Text style={[styles.cardRange, { color: colors.inkSecondary }]}>{range}</Text>
          </View>
          <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.ink }]}>
            {block.busy ? block.title : 'Sala libre'}
          </Text>
          {block.busy ? (
            <View style={styles.cardRow}>
              <Ionicons name="person-circle-outline" size={20} color={colors.inkSecondary} />
              <View style={styles.cardWho}>
                <Text numberOfLines={1} style={[styles.cardName, { color: colors.ink }]}>
                  {block.organizer ?? 'Sin organizador'}
                </Text>
                {block.organizerEmail ? (
                  <Text numberOfLines={1} style={[styles.cardMeta, { color: colors.inkMuted }]}>
                    {block.organizerEmail}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
          <View style={styles.cardRow}>
            <Ionicons name="time-outline" size={18} color={colors.inkSecondary} />
            <Text style={[styles.cardMeta, { color: colors.inkSecondary }]}>
              {block.busy ? `Reservada por ${duration}` : `Libre por ${duration}`}
            </Text>
          </View>
        </GlassSurface>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  tile: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  headerTitle: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  headerRight: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  trackArea: { height: HIT },
  segment: { position: 'absolute', top: 0, height: HIT },
  hit: { flex: 1, justifyContent: 'center' },
  bar: { overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: BAR_ACTIVE, overflow: 'hidden' },
  now: { position: 'absolute', top: -6, width: 56, alignItems: 'center' },
  nowLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3, fontVariant: ['tabular-nums'] },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  endLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, fontVariant: ['tabular-nums'] },
  // Por encima de la fila "Agenda de hoy" para no taparla.
  card: { position: 'absolute', bottom: HIT + HEADER_H + 12, width: CARD_W },
  cardContent: { padding: space.md, gap: space.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  cardDot: { width: 8, height: 8, borderRadius: 4 },
  cardState: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3, flex: 1 },
  cardRange: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  cardTitle: { fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  cardWho: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardMeta: { fontSize: 13, fontWeight: '500' },
});
