import { BlurView } from 'expo-blur';
import { LinearGradient as Gradient } from 'expo-linear-gradient';
import { type ReactNode, useId, useState } from 'react';
import { type LayoutChangeEvent, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useBlurTarget } from '@/design/components/app-background';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';

/**
 * Superficie de vidrio tipo iOS: desenfoque del fondo + velo + brillo superior
 * + borde especular en degradado (más brillante en las esquinas).
 */
export function GlassSurface({
  children,
  radius = 24,
  strong = false,
  style,
  contentStyle,
}: {
  children?: ReactNode;
  radius?: number;
  /** Velo más opaco, para paneles con mucho texto (menú lateral). */
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { glass } = useVisualTheme();
  const blurTarget = useBlurTarget();
  const gradientId = `edge-${useId().replace(/:/g, '')}`;
  const [size, setSize] = useState({ width: 0, height: 0 });

  const ring = Math.max(0, Math.min(radius, size.width / 2, size.height / 2) - 0.5);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.shadow,
        { borderRadius: radius, shadowColor: glass.shadow },
        style,
      ]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        <BlurView
          tint={glass.blurTint}
          intensity={glass.blurIntensity}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={blurTarget ?? undefined}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: strong ? glass.fillStrong : glass.fill },
          ]}
        />
        <Gradient
          colors={[glass.sheen, 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sheen}
        />
      </View>
      {size.width > 0 ? (
        <Svg
          pointerEvents="none"
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={glass.edge[0]} />
              <Stop offset="0.45" stopColor={glass.edge[1]} />
              <Stop offset="1" stopColor={glass.edge[2]} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0.5}
            y={0.5}
            width={size.width - 1}
            height={size.height - 1}
            rx={ring}
            ry={ring}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={1}
          />
        </Svg>
      ) : null}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  // Brillo suave en la mitad superior, como la luz que entra por el canto del vidrio.
  sheen: { position: 'absolute', left: 0, right: 0, top: 0, height: '55%' },
});
