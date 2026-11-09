import type { EventoSala } from '@/types/agenda';
import { minutesToTimeString, parseTimeToMinutes } from '@/utils/time';

/** Estado de la sala en un momento dado. */
export type RoomState = 'available' | 'soon' | 'occupied';

/** Minutos antes de una reunión en los que la sala pasa a "por ocuparse". */
export const SOON_MINUTES = 15;

/** Bloque continuo de la agenda del día (minutos desde las 00:00). */
export interface ScheduleBlock {
  id: string;
  start: number;
  end: number;
  busy: boolean;
  title: string;
  organizer: string | null;
  organizerEmail: string | null;
}

export interface RoomStatusInfo {
  state: RoomState;
  /** Bloque en curso (puede ser libre u ocupado). */
  current: ScheduleBlock | null;
  /** Próxima reunión que aún no empieza. */
  next: ScheduleBlock | null;
  /** Hasta cuándo dura el estado actual (minutos del día) o null si sigue todo el día. */
  until: number | null;
  /** Minutos que faltan para `until`. */
  minutesLeft: number | null;
}

const isMeeting = (e: EventoSala) =>
  e.id !== null && e.titulo.trim().toLowerCase() !== 'disponible';

/**
 * Convierte los eventos del backend en una secuencia continua de bloques sin huecos:
 * las reuniones como bloques ocupados y todo lo demás como libre, dentro del rango del día
 * que cubren los eventos (por defecto 08:00–18:00).
 */
export function toScheduleBlocks(eventos: EventoSala[]): ScheduleBlock[] {
  const all = eventos.map((e) => ({
    e,
    start: parseTimeToMinutes(e.desde),
    end: parseTimeToMinutes(e.hasta),
  }));
  const dayStart = all.length ? Math.min(...all.map((x) => x.start)) : 8 * 60;
  const dayEnd = all.length ? Math.max(...all.map((x) => x.end)) : 18 * 60;

  const meetings = all
    .filter((x) => isMeeting(x.e) && x.end > x.start)
    .sort((a, b) => a.start - b.start);

  const blocks: ScheduleBlock[] = [];
  let cursor = dayStart;
  const pushFree = (start: number, end: number) => {
    if (end > start) {
      blocks.push({
        id: `free-${start}`,
        start,
        end,
        busy: false,
        title: 'Disponible',
        organizer: null,
        organizerEmail: null,
      });
    }
  };

  for (const m of meetings) {
    const start = Math.max(m.start, cursor);
    if (m.end <= start) continue; // totalmente solapada con la anterior
    pushFree(cursor, start);
    blocks.push({
      id: m.e.id ?? `meeting-${start}`,
      start,
      end: m.end,
      busy: true,
      title: m.e.titulo.trim(),
      organizer: m.e.organizador,
      organizerEmail: m.e.correo_organizador,
    });
    cursor = m.end;
  }
  pushFree(cursor, Math.max(cursor, dayEnd));
  return blocks;
}

/** Estado de la sala en el minuto `now` (minutos desde las 00:00). */
export function getRoomStatus(
  blocks: ScheduleBlock[],
  now: number,
  soonMinutes = SOON_MINUTES,
): RoomStatusInfo {
  const current = blocks.find((b) => now >= b.start && now < b.end) ?? null;
  const next = blocks.find((b) => b.busy && b.start > now) ?? null;

  if (current?.busy) {
    // Reuniones encadenadas cuentan como una sola ocupación.
    let until = current.end;
    for (const b of blocks) if (b.busy && b.start === until) until = b.end;
    return { state: 'occupied', current, next, until, minutesLeft: until - now };
  }

  const until = next ? next.start : null;
  const minutesLeft = until !== null ? until - now : null;
  const state: RoomState =
    minutesLeft !== null && minutesLeft <= soonMinutes ? 'soon' : 'available';
  return { state, current, next, until, minutesLeft };
}

export const formatMinutes = minutesToTimeString;

/** "45 min", "1 h", "1 h 30 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

/** Minutos desde las 00:00 de una fecha. */
export const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes();

/** Frase corta del estado para listas y tarjetas ("Libre hasta las 1:00 PM"…). */
export function statusLine(info: RoomStatusInfo): string {
  if (info.state === 'occupied') return `Ocupada hasta las ${formatMinutes(info.until ?? 0)}`;
  if (info.state === 'soon' && info.until !== null) {
    return `Reunión a las ${formatMinutes(info.until)} · en ${info.minutesLeft} min`;
  }
  return info.until !== null ? `Libre hasta las ${formatMinutes(info.until)}` : 'Libre el resto del día';
}
