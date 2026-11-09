import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { GlassSurface } from '@/design/components/glass-surface';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS = { damping: 16, stiffness: 320 };
const TURN = { damping: 14, stiffness: 120, mass: 0.9 };

/** Botón circular de vidrio con un icono. `rotation` (grados) gira el icono con resorte. */
export function GlassIconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 48,
  rotation = 0,
  style,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  rotation?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useVisualTheme();
  const scale = useSharedValue(1);
  const turn = useSharedValue(rotation);

  useEffect(() => {
    turn.set(withSpring(rotation, TURN));
  }, [rotation, turn]);

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      onPressIn={() => scale.set(withSpring(0.9, PRESS))}
      onPressOut={() => scale.set(withSpring(1, PRESS))}
      style={[pressStyle, style]}>
      <GlassSurface
        radius={size / 2}
        style={{ width: size, height: size }}
        contentStyle={[StyleSheet.absoluteFill, styles.center]}>
        <Animated.View style={iconStyle}>
          <Ionicons name={icon} size={Math.round(size * 0.46)} color={colors.ink} />
        </Animated.View>
      </GlassSurface>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
