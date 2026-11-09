import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { RoomClock } from '@/design/components/room-clock';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import type { PhotoSource } from '@/design/room-photos';

/**
 * Foto de la sala en tarjeta (16:9, esquinas de 14 px) con un zoom lento continuo,
 * sombreado inferior y la hora/fecha en una pastilla en la esquina inferior izquierda.
 */
export function PhotoCard({
  source,
  now,
  style,
}: {
  source: PhotoSource;
  now: Date;
  style?: StyleProp<ViewStyle>;
}) {
  const { glass } = useVisualTheme();
  const reduce = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    t.set(withRepeat(withTiming(1, { duration: 26_000, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [reduce, t]);

  const kenBurns = useAnimatedStyle(() => ({
    transform: [
      { scale: 1.04 + 0.08 * t.value },
      { translateX: -12 * t.value },
      { translateY: -8 * t.value },
    ],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(900).delay(200)}
      style={[styles.card, { borderColor: glass.edge[1] }, style]}
      accessibilityRole="image"
      accessibilityLabel="Foto de la sala">
      <Animated.View style={[StyleSheet.absoluteFill, kenBurns]}>
        <Image source={source} contentFit="cover" transition={400} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {/* Sombreado inferior y en la esquina de la hora, para que se lea sobre cualquier foto. */}
      <LinearGradient
        colors={['rgba(6,14,30,0)', 'rgba(6,14,30,0.3)', 'rgba(6,14,30,0.7)']}
        locations={[0.45, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(6,14,30,0.5)', 'rgba(6,14,30,0)']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0.7, y: 0.35 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.clock}>
        <RoomClock now={now} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#040A18',
    shadowOpacity: 0.32,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 24 },
  },
  clock: { position: 'absolute', left: 20, bottom: 20 },
});
