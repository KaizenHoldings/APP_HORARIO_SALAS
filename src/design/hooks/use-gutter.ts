import { useWindowDimensions } from 'react-native';

/**
 * Margen lateral de pantalla, compartido por la navbar y el contenido para que todo
 * quede alineado. Crece con el ancho: móvil 20 · tablet vertical 40 · tablet horizontal 64.
 */
export function useGutter() {
  const { width } = useWindowDimensions();
  if (width >= 1100) return 64;
  if (width >= 700) return 40;
  return 20;
}
