import { Ionicons } from '@expo/vector-icons';
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
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { GlassSurface } from '@/design/components/glass-surface';
import { PulseDot } from '@/design/components/pulse-dot';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { space } from '@/design/tokens';
import { formatDuration, formatMinutes, type ScheduleBlock } from '@/utils/room-status';

const TRACK = 12;
const TRACK_ACTIVE = 20;
const HIT = 48;
const GAP = 3;
const CARD_W = 300;
const AUTO_CLOSE_MS = 8000;
const EASE = Easing.bezier(0.23, 1, 0.32, 1);
const GROW = { damping: 15, stiffness: 260, mass: 0.7 };

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'PM' : 'AM'}`;

/**
 * Línea de tiempo del día: bloques verdes (libre) y rojos (ocupado), lo ya transcurrido
 * atenuado y un punto "ahora". Al tocar un bloque crece y aparece una tarjeta de vidrio
 * con el detalle (quién reservó y a qué hora). Se cierra sola a los 8 s o al tocar fuera.
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
  const x = (m: number) => ((m - dayStart) / span) * width;

  const firstHour = Math.ceil(dayStart / 60);
  const lastHour = Math.floor(dayEnd / 60);
  const pxPerHour = (width * 60) / span;
  const step = pxPerHour < 70 ? 2 : 1;
  const hours: number[] = [];
  for (let h = firstHour; h <= lastHour; h += step) hours.push(h);

  const nowInRange = now >= dayStart && now <= dayEnd;
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

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

      <View style={styles.trackArea} onLayout={onLayout}>
        {width > 0
          ? blocks.map((block, i) => (
              <Segment
                key={block.id}
                block={block}
                index={i}
                left={x(block.start)}
                width={Math.max(2, x(block.end) - x(block.start) - GAP)}
                now={now}
                selected={block.id === selectedId}
                onPress={() => setSelectedId((id) => (id === block.id ? null : block.id))}
              />
            ))
          : null}

        {width > 0 && nowInRange ? (
          <Animated.View
            entering={FadeIn.duration(500).delay(500)}
            pointerEvents="none"
            style={[styles.now, { left: x(now) - 9 }]}>
            <View style={[styles.nowRing, { borderColor: colors.ink }]}>
              <PulseDot color={colors.ink} size={10} />
            </View>
          </Animated.View>
        ) : null}

        {selected && width > 0 ? (
          <DetailCard
            key={selected.id}
            block={selected}
            left={Math.min(
              Math.max(0, x((selected.start + selected.end) / 2) - CARD_W / 2),
              Math.max(0, width - CARD_W),
            )}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </View>

      <View style={styles.labels} pointerEvents="none">
        {width > 0
          ? hours.map((h) => (
              <Text
                key={h}
                style={[
                  styles.hour,
                  { left: x(h * 60) - 30, color: colors.inkMuted },
                ]}>
                {hourLabel(h)}
              </Text>
            ))
          : null}
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
  onPress,
}: {
  block: ScheduleBlock;
  index: number;
  left: number;
  width: number;
  now: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { status } = useVisualTheme();
  const thickness = useSharedValue(TRACK);

  useEffect(() => {
    thickness.set(withSpring(selected ? TRACK_ACTIVE : TRACK, GROW));
  }, [selected, thickness]);

  const barStyle = useAnimatedStyle(() => ({
    height: thickness.value,
    borderRadius: thickness.value / 2,
  }));

  const color = block.busy ? status.occupied.main : status.available.main;
  // Parte ya transcurrida del bloque, atenuada.
  const pastRatio = Math.min(1, Math.max(0, (now - block.start) / (block.end - block.start)));
  const label = block.busy
    ? `${block.title}, ${formatMinutes(block.start)} a ${formatMinutes(block.end)}`
    : `Libre de ${formatMinutes(block.start)} a ${formatMinutes(block.end)}`;

  return (
    <Animated.View
      entering={FadeIn.duration(450).delay(250 + index * 70)}
      style={[styles.segment, { left, width }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={styles.hit}>
        <Animated.View style={[styles.bar, barStyle, selected && styles.barSelected]}>
          <View style={[styles.piece, { flex: pastRatio, backgroundColor: color, opacity: 0.3 }]} />
          <View
            style={[
              styles.piece,
              { flex: 1 - pastRatio, backgroundColor: color, opacity: block.busy ? 1 : 0.85 },
            ]}
          />
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
  root: { paddingTop: space.sm },
  trackArea: { height: HIT },
  segment: { position: 'absolute', top: 0, height: HIT },
  hit: { flex: 1, justifyContent: 'center' },
  bar: { flexDirection: 'row', overflow: 'hidden' },
  barSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  piece: { height: '100%' },
  now: {
    position: 'absolute',
    top: HIT / 2 - 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nowRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: { height: 22, marginTop: 2 },
  hour: {
    position: 'absolute',
    width: 60,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  card: { position: 'absolute', bottom: HIT - 4, width: CARD_W },
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
