import type { ComponentType } from 'react';

import { TokensPreview } from '@/design/components/tokens-preview';

/**
 * Catálogo del laboratorio visual (ruta `/lab`).
 *
 * Cada componente nuevo se registra aquí con una vista previa para poder
 * revisarlo de forma aislada, sin pasar por la pantalla principal.
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
    id: 'tokens',
    title: 'Tokens',
    description: 'Colores, estados y escala tipográfica base.',
    status: 'en-progreso',
    Preview: TokensPreview,
  },
];
