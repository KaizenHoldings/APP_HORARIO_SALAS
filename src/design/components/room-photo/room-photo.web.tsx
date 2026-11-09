/**
 * Foto de la sala que se disuelve en el fondo (web, con CSS mask-image + filter).
 * Mismo efecto que la versión Skia de `room-photo.tsx`.
 */
import { Asset } from 'expo-asset';
import type { CSSProperties } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { RoomPhotoProps } from './room-photo.shared';

export type { RoomPhotoProps } from './room-photo.shared';

const EDGES = [
  'linear-gradient(to right, transparent 0%, #000 45%, #000 92%, transparent 100%)',
  'linear-gradient(to bottom, transparent 0%, #000 14%, #000 62%, transparent 100%)',
].join(', ');
const CORE = 'radial-gradient(ellipse 55% 60% at 64% 42%, #000 50%, transparent 100%)';

export function RoomPhoto({ source, style, blur = 18 }: RoomPhotoProps) {
  const uri = typeof source === 'number' ? Asset.fromModule(source).uri : source.uri;
  const image = `url("${uri}")`;
  const layer: CSSProperties = {
    position: 'absolute',
    backgroundImage: image,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <View style={style} pointerEvents="none">
      <Animated.View entering={FadeIn.duration(900)} style={{ flex: 1 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            maskImage: EDGES,
            WebkitMaskImage: EDGES,
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}>
          <div style={{ ...layer, inset: -blur * 2, filter: `blur(${blur}px)` }} />
          <div style={{ ...layer, inset: 0, maskImage: CORE, WebkitMaskImage: CORE }} />
        </div>
      </Animated.View>
    </View>
  );
}
