import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { font, numbers } from '@/design/tokens';

const EASE = Easing.bezier(0.23, 1, 0.32, 1);

function parts(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const time = `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`;
  const period = h >= 12 ? 'PM' : 'AM';
  const day = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return { time, period, day: day.charAt(0).toUpperCase() + day.slice(1) };
}

/**
 * Hora y fecha en una pastilla oscura translúcida (va sobre la foto de la sala, así se lee
 * igual en claro y oscuro). Cada cambio de minuto entra con un leve deslizamiento.
 */
export function RoomClock({ now }: { now: Date }) {
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

  return (
    <View style={styles.pill} accessibilityLabel={`${time} ${period}, ${day}`}>
      <Animated.View style={[styles.row, tick]}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.period}>{period}</Text>
      </Animated.View>
      <Text style={styles.date}>{day}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(8,14,28,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  time: {
    fontSize: 52,
    lineHeight: 56,
    ...font.light,
    ...numbers,
    letterSpacing: -1,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 2 },
  },
  period: { fontSize: 20, ...font.medium, color: 'rgba(255,255,255,0.88)' },
  date: { fontSize: 15, ...font.regular, color: 'rgba(255,255,255,0.9)' },
});
