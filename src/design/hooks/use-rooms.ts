import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { apiConfigured, fetchAgenda, fetchSalas, localDateISO } from '@/services/salas-api';
import { type ScheduleBlock, toScheduleBlocks } from '@/utils/room-status';

/** Sala con su agenda del día ya convertida a bloques. */
export interface RoomData {
  email: string;
  name: string;
  blocks: ScheduleBlock[];
}

export type RoomsStatus = 'loading' | 'ready' | 'offline' | 'unconfigured';

const REFRESH_MS = 60_000;
const CACHE_KEY = '@salas_tablet_rooms_cache_v1';

interface Cache {
  date: string;
  savedAt: number;
  rooms: RoomData[];
}

/**
 * Salas del sistema y la agenda de hoy de cada una, refrescadas cada minuto.
 * Si el backend falla, conserva lo último que se cargó (también tras reiniciar la app,
 * mientras sea del mismo día) e indica `offline`.
 */
export function useRooms() {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [status, setStatus] = useState<RoomsStatus>(apiConfigured ? 'loading' : 'unconfigured');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const roomsRef = useRef<RoomData[]>([]);

  const load = useCallback(async () => {
    if (!apiConfigured) {
      setStatus('unconfigured');
      setError('EXPO_PUBLIC_API_URL no configurada');
      return;
    }
    const date = localDateISO();
    try {
      const salas = await fetchSalas();
      const results = await Promise.allSettled(salas.map((s) => fetchAgenda(s.email, date)));
      const previous = roomsRef.current;
      const next: RoomData[] = salas.map((sala, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') {
          return {
            email: sala.email,
            name: r.value.sala.nombre || sala.nombre || sala.email,
            blocks: toScheduleBlocks(r.value.eventos ?? []),
          };
        }
        // Falló solo esta agenda: se mantiene la anterior de esa sala si existe.
        const old = previous.find((p) => p.email === sala.email);
        return old ?? { email: sala.email, name: sala.nombre || sala.email, blocks: toScheduleBlocks([]) };
      });
      const failed = results.filter((r) => r.status === 'rejected');
      roomsRef.current = next;
      setRooms(next);
      setUpdatedAt(Date.now());
      setStatus(failed.length ? 'offline' : 'ready');
      setError(failed.length ? `No se pudo actualizar la agenda de ${failed.length} sala(s)` : null);
      const cache: Cache = { date, savedAt: Date.now(), rooms: next };
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache)).catch(() => {});
    } catch (err) {
      setStatus('offline');
      setError(err instanceof Error ? err.message : 'Error de red');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    // Primero lo guardado (pantalla útil al instante y sin red), luego el backend.
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        const cache = raw ? (JSON.parse(raw) as Cache) : null;
        if (alive && cache && cache.date === localDateISO() && roomsRef.current.length === 0) {
          roomsRef.current = cache.rooms;
          setRooms(cache.rooms);
          setUpdatedAt(cache.savedAt);
        }
      } catch {
        // Sin caché: se espera al backend.
      }
      if (alive) await load();
    })();
    const interval = setInterval(() => void load(), REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [load]);

  return { rooms, status, updatedAt, error, refresh: load };
}
