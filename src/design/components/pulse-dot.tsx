import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Punto de estado con un anillo que se expande y desvanece en bucle (señal "en vivo"). */
export function PulseDot({ color, size = 14 }: { color: string; size?: number }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduce) return;
    t.set(0);
    t.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
  }, [reduce, t]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - t.value),
    transform: [{ scale: 1 + t.value * 1.6 }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      {!reduce ? (
        <Animated.View
          style={[styles.fill, { borderRadius: size / 2, backgroundColor: color }, ring]}
        />
      ) : null}
      <View
        style={[
          styles.fill,
          {
            borderRadius: size / 2,
            backgroundColor: color,
            shadowColor: color,
            shadowOpacity: 0.8,
            shadowRadius: size * 0.6,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill },
});
