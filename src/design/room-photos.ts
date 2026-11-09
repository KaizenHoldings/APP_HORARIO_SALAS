/**
 * Foto de cada sala, por correo de la sala. Para añadir una: guardar la imagen en
 * `assets/images/rooms/` (≈1200 px de ancho, JPG) y registrarla aquí.
 *
 * Placeholder: foto de Unsplash (licencia Unsplash, uso libre) hasta tener las fotos reales.
 */
const PLACEHOLDER = require('../../assets/images/rooms/sala-placeholder.jpg');

const PHOTOS: Record<string, number> = {
  // 'sala.socado@kaizenholdings.net': require('../../assets/images/rooms/socado.jpg'),
};

export function roomPhoto(email?: string | null): number {
  return (email && PHOTOS[email.toLowerCase()]) || PLACEHOLDER;
}
