/** Parámetros de animación (resortes y duraciones) para react-native-reanimated. */

export const spring = {
  soft: { damping: 18, stiffness: 160, mass: 0.9 },
  snappy: { damping: 20, stiffness: 260, mass: 0.8 },
} as const;

export const duration = {
  fast: 150,
  base: 250,
  slow: 450,
} as const;
