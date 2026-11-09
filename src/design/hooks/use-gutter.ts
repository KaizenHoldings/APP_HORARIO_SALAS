import { useWindowDimensions } from 'react-native';

/**
 * Margen lateral de la retícula, compartido por la navbar y el contenido para que todo quede
 * alineado (logo / nombre / barra a la izquierda; tuerca / foto / barra a la derecha).
 * Tablet horizontal: 9,4 % del ancho (120 px en 1280) · tablet vertical: 64 · móvil: 20.
 */
export function useGutter() {
  const { width, height } = useWindowDimensions();
  if (width >= 1000 && width >= height) return Math.round(width * 0.094);
  if (width >= 700) return 64;
  return 20;
}
