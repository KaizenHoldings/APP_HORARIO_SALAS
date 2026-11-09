/**
 * Fotos de las salas.
 *
 * Desde Admin → Salas se elige una foto de la galería incluida en la app o se sube una
 * propia (se copia a la carpeta de documentos de la app). Se guarda como:
 * - `gallery:<n>`  una foto de la galería incluida;
 * - `file://…`     una foto subida en esta tablet.
 *
 * Galería: fotos de Unsplash (licencia Unsplash, uso libre) hasta tener las fotos reales.
 */
export type PhotoSource = number | { uri: string };

export const GALLERY: { source: number; label: string }[] = [
  { source: require('../../assets/images/rooms/sala-placeholder.jpg'), label: 'Sala con mesa de madera' },
  { source: require('../../assets/images/rooms/sala-2.jpg'), label: 'Sala de juntas amplia' },
  { source: require('../../assets/images/rooms/sala-3.jpg'), label: 'Sala con ventanales' },
  { source: require('../../assets/images/rooms/sala-4.jpg'), label: 'Sala lounge' },
];

export const galleryRef = (index: number) => `gallery:${index}`;

/** Resuelve la foto guardada de una sala (o la primera de la galería si no tiene). */
export function resolvePhoto(ref?: string | null): PhotoSource {
  if (ref?.startsWith('gallery:')) {
    const i = Number(ref.slice('gallery:'.length));
    return GALLERY[i]?.source ?? GALLERY[0].source;
  }
  if (ref) return { uri: ref };
  return GALLERY[0].source;
}

/** Compatibilidad con el laboratorio: foto por defecto. */
export function roomPhoto(): number {
  return GALLERY[0].source;
}
