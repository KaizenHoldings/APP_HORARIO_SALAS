import { BlurTargetView } from 'expo-blur';
import { createContext, type ReactNode, type RefObject, useContext, useRef } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Grainient } from '@/design/components/grainient';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { background } from '@/design/tokens';

const BlurTargetContext = createContext<RefObject<View | null> | null>(null);

/** Ref del fondo que desenfocan las superficies de vidrio (Android lo necesita explícito). */
export function useBlurTarget() {
  return useContext(BlurTargetContext);
}

/**
 * Fondo base de todas las pantallas: Grainient a pantalla completa según el esquema
 * claro/oscuro, con el contenido encima. Al cambiar de esquema hace un fundido cruzado.
 */
export function AppBackground({
  children,
  style,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { scheme, custom } = useVisualTheme();
  const targetRef = useRef<View | null>(null);
  const { fallback, ...grainient } = background[scheme];
  // Tono de fondo personalizado (Admin → Colores); null = colores originales.
  const colors = custom.background?.[scheme] ?? grainient.colors;

  return (
    <View style={[styles.root, { backgroundColor: fallback }, style]}>
      <BlurTargetView ref={targetRef} style={StyleSheet.absoluteFill}>
        <Animated.View
          key={`${scheme}-${colors.join()}`}
          entering={FadeIn.duration(700)}
          exiting={FadeOut.duration(700)}
          style={StyleSheet.absoluteFill}>
          <Grainient {...grainient} colors={colors} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </BlurTargetView>
      <BlurTargetContext.Provider value={targetRef}>{children}</BlurTargetContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
});
