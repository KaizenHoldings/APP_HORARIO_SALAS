import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GlassSurface } from '@/design/components/glass-surface';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { radius, type } from '@/design/tokens';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
}

const PAD = 4;
const HEIGHT = 48;
const THUMB_SPRING = { damping: 22, stiffness: 240, mass: 0.9 };

/**
 * Switch segmentado de vidrio: una píldora sólida se desliza con resorte hasta la opción
 * activa y el texto cambia de color a medida que la píldora pasa por debajo.
 */
export function SegmentedSwitch<T extends string>({
  options,
  value,
  onChange,
  segmentWidth = 132,
  style,
  accessibilityLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  /** Ancho de cada opción; se reduce si no hay espacio. */
  segmentWidth?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { glass } = useVisualTheme();
  const index = Math.max(0, options.findIndex((o) => o.id === value));
  const [segW, setSegW] = useState(segmentWidth);

  const x = useSharedValue(index * segW);
  const squash = useSharedValue(1);
  const position = useDerivedValue(() => (segW > 0 ? x.value / segW : 0));

  useEffect(() => {
    x.set(withSpring(index * segW, THUMB_SPRING));
    squash.set(withSequence(withTiming(0.92, { duration: 90 }), withSpring(1, THUMB_SPRING)));
  }, [index, segW, x, squash]);

  const onLayout = (e: LayoutChangeEvent) => {
    const inner = e.nativeEvent.layout.width - PAD * 2;
    const next = inner / options.length;
    if (Math.abs(next - segW) > 0.5) {
      setSegW(next);
      x.set(index * next);
    }
  };

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { scaleX: squash.value }, { scaleY: 2 - squash.value }],
  }));

  return (
    <GlassSurface
      radius={radius.pill}
      style={[{ width: segmentWidth * options.length + PAD * 2, maxWidth: '100%' }, style]}>
      <View
        onLayout={onLayout}
        style={styles.track}
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}>
        <Animated.View
          style={[
            styles.thumb,
            { width: segW, backgroundColor: glass.thumb, shadowColor: glass.shadow },
            thumbStyle,
          ]}
        />
        {options.map((option, i) => (
          <Segment
            key={option.id}
            label={option.label}
            index={i}
            position={position}
            selected={i === index}
            onPress={() => onChange(option.id)}
          />
        ))}
      </View>
    </GlassSurface>
  );
}

function Segment({
  label,
  index,
  position,
  selected,
  onPress,
}: {
  label: string;
  index: number;
  position: SharedValue<number>;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, glass } = useVisualTheme();
  const pressed = useSharedValue(0);
  const ink = colors.ink;
  const activeInk = glass.thumbInk;

  const textStyle = useAnimatedStyle(() => {
    const t = Math.max(0, 1 - Math.abs(position.value - index));
    return {
      color: interpolateColor(t, [0, 1], [ink, activeInk]),
      opacity: (0.72 + 0.28 * t) * (1 - pressed.value * 0.35),
    };
  });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={() => pressed.set(withTiming(1, { duration: 80 }))}
      onPressOut={() => pressed.set(withTiming(0, { duration: 160 }))}
      style={styles.segment}>
      <Animated.Text numberOfLines={1} style={[type.caption, styles.label, textStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: PAD, height: HEIGHT },
  thumb: {
    position: 'absolute',
    top: PAD,
    left: PAD,
    bottom: PAD,
    borderRadius: radius.pill,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  label: { fontSize: 15, fontWeight: '600', letterSpacing: -0.1 },
});
