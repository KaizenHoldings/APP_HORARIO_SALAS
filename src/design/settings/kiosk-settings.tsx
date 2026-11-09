import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import type { BrandId } from '@/design/brands';
import type { EquipmentId } from '@/design/settings/equipment';
import { buildPalette, type ColorSet, ORIGINAL_COLORS, type Palette } from '@/design/settings/palette';
import { getConfiguredRoom } from '@/utils/storage';

/**
 * Ajustes de esta tablet (Admin), guardados en el equipo:
 * marca, sala que muestra, datos extra de cada sala (foto, equipamiento, capacidad) y colores.
 * Las salas en sí vienen del backend; aquí solo se guarda lo que el backend no tiene.
 */
export interface RoomMeta {
  /** `gallery:<n>` o `file://…` (ver room-photos.ts). */
  photo?: string;
  equipment: EquipmentId[];
  capacity?: number;
}

export interface KioskSettings {
  brand: BrandId;
  /** Correo de la sala que muestra "Esta sala"; null = la primera disponible. */
  roomEmail: string | null;
  rooms: Record<string, RoomMeta>;
  colors: ColorSet;
}

const STORAGE_KEY = '@salas_tablet_kiosk_settings_v1';

export const DEFAULT_SETTINGS: KioskSettings = {
  brand: 'kh',
  roomEmail: null,
  rooms: {},
  colors: ORIGINAL_COLORS,
};

interface KioskSettingsState {
  settings: KioskSettings;
  loaded: boolean;
  palette: Palette;
  setBrand: (brand: BrandId) => void;
  setRoomEmail: (email: string) => void;
  updateRoom: (email: string, patch: Partial<RoomMeta>) => void;
  setColor: (key: keyof ColorSet, hex: string) => void;
  resetColors: () => void;
}

const Ctx = createContext<KioskSettingsState | null>(null);

export const roomMetaOf = (settings: KioskSettings, email: string): RoomMeta =>
  settings.rooms[email.toLowerCase()] ?? { equipment: [] };

export function KioskSettingsProvider({
  children,
  initial,
  persist = true,
}: {
  children: ReactNode;
  initial?: Partial<KioskSettings>;
  persist?: boolean;
}) {
  const [settings, setSettings] = useState<KioskSettings>({ ...DEFAULT_SETTINGS, ...initial });
  const [loaded, setLoaded] = useState(!persist);

  // Carga inicial; si no hay sala elegida, migra la de la pantalla anterior.
  useEffect(() => {
    if (!persist) return;
    let alive = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const saved = raw ? (JSON.parse(raw) as Partial<KioskSettings>) : {};
        const legacy = saved.roomEmail ? null : await getConfiguredRoom();
        if (!alive) return;
        setSettings((s) => ({
          ...s,
          ...saved,
          colors: { ...ORIGINAL_COLORS, ...saved.colors },
          rooms: saved.rooms ?? {},
          roomEmail: saved.roomEmail ?? legacy?.email ?? null,
        }));
      } catch (error) {
        console.warn('No se pudieron leer los ajustes de la tablet:', error);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [persist]);

  // Guarda cada cambio (después de la carga inicial).
  useEffect(() => {
    if (!persist || !loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch((error) =>
      console.warn('No se pudieron guardar los ajustes de la tablet:', error),
    );
  }, [settings, persist, loaded]);

  const value = useMemo<KioskSettingsState>(
    () => ({
      settings,
      loaded,
      palette: buildPalette(settings.colors),
      setBrand: (brand) => setSettings((s) => ({ ...s, brand })),
      setRoomEmail: (email) => setSettings((s) => ({ ...s, roomEmail: email })),
      updateRoom: (email, patch) =>
        setSettings((s) => {
          const key = email.toLowerCase();
          const current = s.rooms[key] ?? { equipment: [] };
          return { ...s, rooms: { ...s.rooms, [key]: { ...current, ...patch } } };
        }),
      setColor: (key, hex) => setSettings((s) => ({ ...s, colors: { ...s.colors, [key]: hex } })),
      resetColors: () => setSettings((s) => ({ ...s, colors: ORIGINAL_COLORS })),
    }),
    [settings, loaded],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const FALLBACK: KioskSettingsState = {
  settings: DEFAULT_SETTINGS,
  loaded: true,
  palette: buildPalette(ORIGINAL_COLORS),
  setBrand: () => {},
  setRoomEmail: () => {},
  updateRoom: () => {},
  setColor: () => {},
  resetColors: () => {},
};

/** Ajustes de la tablet; fuera de un provider devuelve los valores por defecto. */
export function useKioskSettings(): KioskSettingsState {
  return useContext(Ctx) ?? FALLBACK;
}
