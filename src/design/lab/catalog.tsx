import type { ComponentType } from 'react';

import { BackgroundPreview } from './background-preview';
import { TokensPreview } from './tokens-preview';

/**
 * Catálogo del laboratorio visual (ruta `/lab`).
 *
 * Todo el laboratorio se dibuja sobre `AppBackground`, así cada componente se revisa
 * en su entorno real. Cada entrada se puede ver en claro y oscuro desde la barra superior.
 */
export type CatalogStatus = 'idea' | 'en-progreso' | 'listo';

export interface CatalogEntry {
  id: string;
  title: string;
  description: string;
  status: CatalogStatus;
  Preview: ComponentType;
}

export const catalog: CatalogEntry[] = [
  {
    id: 'background',
    title: 'Fondo',
    description: 'Grainient animado (React Bits): navy → azul → hielo.',
    status: 'en-progreso',
    Preview: BackgroundPreview,
  },
  {
    id: 'tokens',
    title: 'Tokens',
    description: 'Colores, estados y escala tipográfica base.',
    status: 'en-progreso',
    Preview: TokensPreview,
  },
];
