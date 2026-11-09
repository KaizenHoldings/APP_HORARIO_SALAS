import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { getThemePreference, saveThemePreference, type ThemePreference } from '@/utils/storage';

export type { ThemePreference } from '@/utils/storage';

interface ThemeState {
  /** 'system' sigue al sistema; 'light' | 'dark' lo fuerzan. */
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

/**
 * Preferencia de tema de la nueva visual.
 * Con `persist` (por defecto) lee y guarda la preferencia en AsyncStorage,
 * la misma clave que usa la pantalla actual.
 */
export function VisualThemeProvider({
  initial,
  persist = true,
  children,
}: {
  initial?: ThemePreference;
  persist?: boolean;
  children: ReactNode;
}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initial ?? 'system');

  useEffect(() => {
    if (!persist || initial) return;
    let alive = true;
    void getThemePreference().then((saved) => {
      if (alive) setPreferenceState(saved);
    });
    return () => {
      alive = false;
    };
  }, [persist, initial]);

  const value = useMemo<ThemeState>(
    () => ({
      preference,
      setPreference: (next) => {
        setPreferenceState(next);
        if (persist) void saveThemePreference(next);
      },
    }),
    [preference, persist],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Estado del tema; fuera de un provider sigue al sistema y no se puede cambiar. */
export function useThemePreference(): ThemeState {
  return useContext(ThemeContext) ?? { preference: 'system', setPreference: () => {} };
}
