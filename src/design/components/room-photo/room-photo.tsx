/**
 * Foto de la sala que se disuelve en el fondo (iOS / Android, con Skia):
 * - una copia desenfocada hace de halo en los bordes;
 * - la foto nítida se ve en el centro y se funde hacia los bordes;
 * - todo se desvanece hacia la izquierda y hacia abajo para integrarse con el degradado.
 */
import {
  Blur,
  Canvas,
  Image,
  LinearGradient,
  Mask,
  RadialGradient,
  Rect,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import { useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { RoomPhotoProps } from './room-photo.shared';

export type { RoomPhotoProps } from './room-photo.shared';

const CLEAR = 'rgba(0,0,0,0)';
const SOLID = 'rgba(0,0,0,1)';

export function RoomPhoto({ source, style, blur = 18 }: RoomPhotoProps) {
  const image = useImage(typeof source === 'number' ? source : source.uri);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { w, h } = size;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== w || height !== h) setSize({ w: width, h: height });
  };

  const pad = blur * 2;

  return (
    <View style={style} onLayout={onLayout} pointerEvents="none">
      {image && w > 0 && h > 0 ? (
        <Animated.View entering={FadeIn.duration(900)} style={{ width: w, height: h }}>
          <Canvas style={{ width: w, height: h }}>
            {/* Fundido horizontal (izquierda transparente). */}
            <Mask
              mask={
                <Rect x={0} y={0} width={w} height={h}>
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(w, 0)}
                    colors={[CLEAR, SOLID, SOLID, CLEAR]}
                    positions={[0, 0.45, 0.92, 1]}
                  />
                </Rect>
              }>
              {/* Fundido vertical (arriba suave, abajo largo). */}
              <Mask
                mask={
                  <Rect x={0} y={0} width={w} height={h}>
                    <LinearGradient
                      start={vec(0, 0)}
                      end={vec(0, h)}
                      colors={[CLEAR, SOLID, SOLID, CLEAR]}
                      positions={[0, 0.14, 0.62, 1]}
                    />
                  </Rect>
                }>
                <Image
                  image={image}
                  x={-pad}
                  y={-pad}
                  width={w + pad * 2}
                  height={h + pad * 2}
                  fit="cover">
                  <Blur blur={blur} mode="clamp" />
                </Image>
                <Mask
                  mask={
                    <Rect x={0} y={0} width={w} height={h}>
                      <RadialGradient
                        c={vec(w * 0.64, h * 0.42)}
                        r={Math.max(w, h) * 0.55}
                        colors={[SOLID, SOLID, CLEAR]}
                        positions={[0, 0.5, 1]}
                      />
                    </Rect>
                  }>
                  <Image image={image} x={0} y={0} width={w} height={h} fit="cover" />
                </Mask>
              </Mask>
            </Mask>
          </Canvas>
        </Animated.View>
      ) : null}
    </View>
  );
}
