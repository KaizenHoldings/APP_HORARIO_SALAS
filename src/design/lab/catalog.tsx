import type { ComponentType } from 'react';

import { BackgroundPreview } from './background-preview';
import { CodeSlotsPreview } from './code-slots-preview';
import { NavbarPreview } from './navbar-preview';
import { TokensPreview } from './tokens-preview';

/**
 * Catálogo del laboratorio visual (ruta `/lab`).
 *
 * Todo el laboratorio se dibuja sobre `AppBackground`, así cada componente se revisa
 * en su entorno real. La barra inferior cambia de componente y de esquema claro/oscuro.
 *
 * `layout: 'screen'` → la vista previa ocupa toda la pantalla (componentes de estructura).
 * `layout: 'stage'`  → la vista previa va bajo un título, con scroll.
 */
export type CatalogStatus = 'idea' | 'en-progreso' | 'listo';

export interface CatalogEntry {
  id: string;
  title: string;
  description: string;
  status: CatalogStatus;
  layout: 'screen' | 'stage';
  Preview: ComponentType;
}

export const catalog: CatalogEntry[] = [
  {
    id: 'navbar',
    title: 'Navbar',
    description: 'Isotipo, switch Esta sala / Otras salas y menú de ajustes con acceso admin.',
    status: 'en-progreso',
    layout: 'screen',
    Preview: NavbarPreview,
  },
  {
    id: 'code-slots',
    title: 'CodeSlots',
    description: 'Entrada de código (React Bits) portada a Reanimated.',
    status: 'en-progreso',
    layout: 'stage',
    Preview: CodeSlotsPreview,
  },
  {
    id: 'background',
    title: 'Fondo',
    description: 'Grainient animado (React Bits): navy → azul → hielo.',
    status: 'en-progreso',
    layout: 'stage',
    Preview: BackgroundPreview,
  },
  {
    id: 'tokens',
    title: 'Tokens',
    description: 'Colores, estados y escala tipográfica base.',
    status: 'en-progreso',
    layout: 'stage',
    Preview: TokensPreview,
  },
];
