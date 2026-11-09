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
import { font, numbers, space } from '@/design/tokens';
import { formatDuration, formatMinutes, type ScheduleBlock } from '@/utils/room-status';

const BAR = 10;
const BAR_ACTIVE = 14;
const HIT = 44;
const GAP = 10;
const CARD_W = 300;
const AUTO_CLOSE_MS = 8000;
const EASE = Easing.bezier(0.23, 1, 0.32, 1);
const GROW = { damping: 15, stiffness: 260, mass: 0.7 };

const shortTime = (m: number) => formatMinutes(m).replace(/ (AM|PM)$/, '');

/**
 * Línea de tiempo del día (estilo barras de progreso): una píldora por bloque, roja si está
 * reservada y azul si está libre. Lo pasado va lleno, el bloque actual se llena hasta "ahora"
 * y lo que viene es una pista translúcida. Al tocar un bloque crece y muestra quién reservó.
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
  const { colors, custom } = useVisualTheme();
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
  const widthOf = (b: ScheduleBlock) => ((b.end - b.start) / span) * usable;
  const lefts: number[] = [];
  let acc = 0;
  for (const b of blocks) {
    lefts.push(acc);
    acc += widthOf(b) + GAP;
  }
  const xOf = (m: number) => {
    const i = blocks.findIndex((b) => m >= b.start && m <= b.end);
    if (i < 0) return m < dayStart ? 0 : width;
    return lefts[i] + ((m - blocks[i].start) / (blocks[i].end - blocks[i].start)) * widthOf(blocks[i]);
  };

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

      <View style={styles.legend} pointerEvents="none">
        <LegendItem colors={custom.bars.busy} label="Ocupada" />
        <LegendItem colors={custom.bars.free} label="Disponible" />
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

export function LegendItem({ colors: g, label, solid }: { colors?: [string, string]; label: string; solid?: string }) {
  const { colors } = useVisualTheme();
  return (
    <View style={styles.legendItem}>
      {solid ? (
        <View style={[styles.legendDot, { backgroundColor: solid }]} />
      ) : (
        <LinearGradient colors={g ?? ['#000', '#000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.legendDot} />
      )}
      <Text style={[styles.legendLabel, { color: colors.inkSecondary }]}>{label}</Text>
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
  const { custom } = useVisualTheme();
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
      reduce
        ? progress
        : withDelay(300 + index * 90, withTiming(progress, { duration: 700, easing: EASE })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    height: thickness.value,
    borderRadius: thickness.value / 2,
  }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${fillRatio.value * 100}%` }));

  const gradient = block.busy ? custom.bars.busy : custom.bars.free;
  const label = block.busy
    ? `${block.title}, ${formatMinutes(block.start)} a ${formatMinutes(block.end)}`
    : `Libre de ${formatMinutes(block.start)} a ${formatMinutes(block.end)}`;

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(200 + index * 60)}
      style={[styles.segment, { left, width }]}>
      {/* La opacidad de "atenuado" va en una vista interior para no chocar con la animación de entrada. */}
      <View style={[styles.hit, { opacity: dimmed ? 0.4 : 1 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={styles.hit}>
        <Animated.View style={[styles.bar, barStyle]}>
          {!isPast ? (
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[StyleSheet.absoluteFill, { opacity: block.busy ? 0.3 : 0.28 }]}
            />
          ) : null}
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
      </View>
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
  const { colors, status, custom, isDark } = useVisualTheme();
  const tone = block.busy ? status.occupied : custom.free;
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
  root: {},
  legend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, ...font.medium, letterSpacing: 0.3 },
  trackArea: { height: HIT },
  segment: { position: 'absolute', top: 0, height: HIT },
  hit: { flex: 1, justifyContent: 'center' },
  bar: { overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden', borderRadius: BAR_ACTIVE },
  now: { position: 'absolute', top: -4, width: 56, alignItems: 'center' },
  nowLabel: { fontSize: 11, ...font.medium, ...numbers, letterSpacing: 0.3 },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  endLabel: { fontSize: 11, ...font.medium, ...numbers, letterSpacing: 0.3 },
  card: { position: 'absolute', bottom: HIT + 12, width: CARD_W },
  cardContent: { padding: space.md, gap: space.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  cardDot: { width: 8, height: 8, borderRadius: 4 },
  cardState: { fontSize: 13, ...font.medium, letterSpacing: 0.3, flex: 1 },
  cardRange: { fontSize: 13, ...font.medium, ...numbers },
  cardTitle: { fontSize: 19, lineHeight: 24, ...font.medium, letterSpacing: -0.1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  cardWho: { flex: 1 },
  cardName: { fontSize: 15, ...font.medium },
  cardMeta: { fontSize: 13, ...font.regular },
});
