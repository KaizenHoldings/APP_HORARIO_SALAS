/**
 * Grainient (iOS / Android) — mismo shader que la versión web, renderizado con
 * react-native-skia. El reloj corre en el hilo de UI (Reanimated), sin re-renders de React.
 *
 * Para cuidar la GPU de la tablet, el shader se calcula a `resolution` (0.5 por defecto)
 * del tamaño real y se escala al mostrarse: el degradado es suave y no pierde nada.
 */
import { Canvas, Fill, Shader, Skia, useClock } from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { type LayoutChangeEvent, PixelRatio, StyleSheet, View } from 'react-native';
import { useDerivedValue, useReducedMotion } from 'react-native-reanimated';

import { buildRamp, type GrainientProps, INTRO_SECONDS, resolveSettings } from './grainient.shared';
import { GRAINIENT_SKSL } from './grainient.sksl';

export type { GrainientProps } from './grainient.shared';

const effect = Skia.RuntimeEffect.Make(GRAINIENT_SKSL);

export function Grainient(props: GrainientProps) {
  const s = resolveSettings(props);
  const reduce = useReducedMotion();
  const clock = useClock();
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const colorsKey = s.colors.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ramp = useMemo(() => buildRamp(s.colors, s.lightMode), [colorsKey, s.lightMode]);

  const res = s.resolution;
  const width = Math.max(1, Math.round(layout.width * res));
  const height = Math.max(1, Math.round(layout.height * res));
  const radians = (s.angle * Math.PI) / 180;
  const aspect = width / height;
  const animate = !reduce;

  const static_ = {
    uResolution: [width, height],
    uPixelScale: Math.min(PixelRatio.get(), 2) / res,
    uRamp: ramp,
    uCount: s.colors.length,
    uType: s.type,
    uDir: [Math.sin(radians), Math.cos(radians)],
    uExtent: aspect * Math.abs(Math.sin(radians)) + Math.abs(Math.cos(radians)),
    uBands: s.bands,
    uSoftness: s.softness,
    uFlow: s.flow,
    uScale: s.scale,
    uSilk: s.silk,
    uSeed: [s.variation * 3.17, s.variation * 1.91],
    uContrast: s.contrast,
    uSaturation: s.saturation,
    uGrain: s.grainAmount,
    uGrainSize: s.grainSize * Math.min(PixelRatio.get(), 2),
  };
  const speed = s.speed;
  const intro = s.intro && animate;
  const grainAnimated = s.grainAnimated && animate;

  const uniforms = useDerivedValue(() => {
    const t = clock.value / 1000;
    const reveal = intro ? Math.min(1, t / INTRO_SECONDS) : 1;
    return {
      ...static_,
      uTime: animate ? t * speed * 0.16 : 0,
      uSettle: reveal * reveal * (3 - 2 * reveal),
      uReveal: reveal,
      uFrame: grainAnimated ? Math.floor(t * 24) % 97 : 0,
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    if (w !== layout.width || h !== layout.height) setLayout({ width: w, height: h });
  };

  return (
    <View style={[styles.container, props.style]} onLayout={onLayout} pointerEvents="none">
      {effect && layout.width > 0 && layout.height > 0 ? (
        <Canvas
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width,
            height,
            transformOrigin: 'left top',
            transform: [{ scaleX: layout.width / width }, { scaleY: layout.height / height }],
          }}>
          <Fill>
            <Shader source={effect} uniforms={uniforms} />
          </Fill>
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', overflow: 'hidden' },
});
