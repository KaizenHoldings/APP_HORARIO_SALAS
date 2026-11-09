import { createContext, useContext } from 'react';

/** Escena activa del laboratorio (estado simulado que eligen las vistas previas). */
export const LabSceneContext = createContext<string | null>(null);

export function useLabScene() {
  return useContext(LabSceneContext);
}
