import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useVisualTheme } from '@/design/hooks/use-visual-theme';

const EASE = Easing.bezier(0.23, 1, 0.32, 1);

function parts(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const time = `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`;
  const period = h >= 12 ? 'PM' : 'AM';
  const day = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return { time, period, day: day.charAt(0).toUpperCase() + day.slice(1) };
}

/** Reloj grande con cifras tabulares; cada cambio de minuto entra con un leve deslizamiento. */
export function RoomClock({ now, align = 'right' }: { now: Date; align?: 'left' | 'right' }) {
  const { colors, isDark } = useVisualTheme();
  const reduce = useReducedMotion();
  const { time, period, day } = parts(now);
  const t = useSharedValue(1);

  useEffect(() => {
    if (reduce) return;
    t.set(0);
    t.set(withTiming(1, { duration: 520, easing: EASE }));
  }, [time, reduce, t]);

  const tick = useAnimatedStyle(() => ({
    opacity: 0.25 + 0.75 * t.value,
    transform: [{ translateY: (1 - t.value) * 8 }],
  }));

  const shadow = isDark ? styles.shadowDark : styles.shadowLight;
  const end = align === 'right';

  return (
    <View style={[styles.root, { alignItems: end ? 'flex-end' : 'flex-start' }]}>
      <Animated.View style={[styles.row, tick]} accessibilityLabel={`${time} ${period}`}>
        <Text style={[styles.time, shadow, { color: colors.ink }]}>{time}</Text>
        <Text style={[styles.period, shadow, { color: colors.inkSecondary }]}>{period}</Text>
      </Animated.View>
      <Text style={[styles.date, shadow, { color: colors.inkSecondary }]}>{day}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  time: {
    fontSize: 72,
    lineHeight: 76,
    fontWeight: '700',
    letterSpacing: -2.5,
    fontVariant: ['tabular-nums'],
  },
  period: { fontSize: 24, fontWeight: '600', letterSpacing: -0.3 },
  date: { fontSize: 18, fontWeight: '500' },
  shadowDark: {
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 18,
    textShadowOffset: { width: 0, height: 2 },
  },
  shadowLight: {
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 1 },
  },
});
