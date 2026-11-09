import { createContext, type ReactNode, useContext } from 'react';

import type { Scheme } from '@/design/tokens/colors';

/** Esquema forzado ('light' | 'dark') o `null` para seguir al sistema. */
const SchemeOverrideContext = createContext<Scheme | null>(null);

export function VisualThemeProvider({
  scheme,
  children,
}: {
  scheme: Scheme | null;
  children: ReactNode;
}) {
  return (
    <SchemeOverrideContext.Provider value={scheme}>{children}</SchemeOverrideContext.Provider>
  );
}

export function useSchemeOverride() {
  return useContext(SchemeOverrideContext);
}
