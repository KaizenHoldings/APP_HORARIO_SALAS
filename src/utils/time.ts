import { EventoSala } from '@/types/agenda';

/**
 * Convierte un string de hora tipo "08:00 AM", "11:30 AM", "05:00 PM" a minutos desde las 00:00 (0 a 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Convierte minutos del día a string amigable tipo "10:00 AM".
 */
export function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Calcula la duración amigable en texto entre dos horarios (ej. "1 h 30 min" o "45 min").
 */
export function calculateDuration(desde: string, hasta: string): string {
  const start = parseTimeToMinutes(desde);
  const end = parseTimeToMinutes(hasta);
  const diff = end >= start ? end - start : end + 1440 - start;

  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  if (hours > 0 && minutes > 0) return `${hours} h ${minutes} min`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  return `${minutes} min`;
}

/**
 * Normaliza los eventos del backend corrigiendo las superposiciones de bloques "Disponible".
 *
 * El backend a menudo asigna "hasta: 05:00 PM" a todos los bloques disponibles.
 * Esta función ajusta el fin de cada bloque disponible para que termine exactamente cuando
 * inicia la siguiente reunión agendada, evitando traslapes y confusiones.
 */
export function normalizeAgendaEventos(rawEventos: EventoSala[]): EventoSala[] {
  if (!rawEventos || rawEventos.length === 0) {
    return [
      {
        id: 'default-disponible',
        desde: '08:00 AM',
        hasta: '06:00 PM',
        titulo: 'Disponible',
        organizador: null,
        correo_organizador: null,
      } as EventoSala
    ];
  }

  // Clonar y ordenar cronológicamente por hora de inicio
  const sorted = [...rawEventos].sort(
    (a, b) => parseTimeToMinutes(a.desde) - parseTimeToMinutes(b.desde)
  );

  // Identificar reuniones reservadas
  const isMeeting = (e: EventoSala) =>
    e.id !== null && e.titulo.trim().toLowerCase() !== 'disponible';

  const normalized: EventoSala[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = { ...sorted[i] };
    const currentStartMin = parseTimeToMinutes(current.desde);

    if (isMeeting(current)) {
      normalized.push(current);
    } else {
      // Es un bloque "Disponible": buscar la próxima reunión que empiece después
      let nextMeetingStartMin: number | null = null;
      let nextMeetingSubject: string | null = null;

      for (let j = 0; j < sorted.length; j++) {
        if (isMeeting(sorted[j])) {
          const meetingStart = parseTimeToMinutes(sorted[j].desde);
          if (meetingStart > currentStartMin) {
            if (nextMeetingStartMin === null || meetingStart < nextMeetingStartMin) {
              nextMeetingStartMin = meetingStart;
              nextMeetingSubject = sorted[j].titulo.trim();
            }
          }
        }
      }

      if (nextMeetingStartMin !== null) {
        // El bloque disponible termina cuando comienza la próxima reunión
        current.hasta = minutesToTimeString(nextMeetingStartMin);
      }

      // Si el bloque disponible tiene duración positiva, agregarlo
      const startMin = parseTimeToMinutes(current.desde);
      const endMin = parseTimeToMinutes(current.hasta);
      if (endMin > startMin) {
        // Enriquecer título con información de la próxima reunión si aplica
        if (nextMeetingSubject) {
          current.organizador = `Próxima reunión a las ${current.hasta}: ${nextMeetingSubject}`;
        }
        normalized.push(current);
      }
    }
  }

  // Ordenar y eliminar duplicados exactos
  return normalized.sort(
    (a, b) => parseTimeToMinutes(a.desde) - parseTimeToMinutes(b.desde)
  );
}

/**
 * Encuentra el índice del evento que corresponde a la hora actual del sistema.
 * Si la hora actual cae en una reunión reservada, le da prioridad absoluta.
 */
export function findCurrentEventIndex(
  eventos: EventoSala[],
  currentDate: Date = new Date()
): number {
  if (!eventos || eventos.length === 0) return 0;

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  // 1. Prioridad: Buscar si la hora actual cae dentro de una reunión reservada
  for (let i = 0; i < eventos.length; i++) {
    const isMeeting =
      eventos[i].id !== null &&
      eventos[i].titulo.trim().toLowerCase() !== 'disponible';
    if (isMeeting) {
      const start = parseTimeToMinutes(eventos[i].desde);
      const end = parseTimeToMinutes(eventos[i].hasta);
      if (currentMinutes >= start && currentMinutes < end) {
        return i;
      }
    }
  }

  // 2. Buscar si cae dentro de cualquier bloque (disponible)
  for (let i = 0; i < eventos.length; i++) {
    const start = parseTimeToMinutes(eventos[i].desde);
    const end = parseTimeToMinutes(eventos[i].hasta);

    if (currentMinutes >= start && currentMinutes < end) {
      return i;
    }
  }

  // 3. Si es antes del primer evento, retornar el primer evento
  const firstStart = parseTimeToMinutes(eventos[0].desde);
  if (currentMinutes < firstStart) {
    return 0;
  }

  // 4. Si es entre eventos o después, buscar el siguiente más cercano
  for (let i = 0; i < eventos.length; i++) {
    const start = parseTimeToMinutes(eventos[i].desde);
    if (start > currentMinutes) {
      return i;
    }
  }

  // 5. Retornar el último evento
  return eventos.length - 1;
}

/**
 * Formatea una fecha u hora para la cabecera estilo iOS (ej. "10:35 AM", "Viernes, 9 de Octubre").
 */
export function formatCurrentTime(date: Date = new Date()): {
  timeString: string;
  dateString: string;
} {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;

  const timeString = `${displayHours}:${displayMinutes} ${period}`;

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const dateString = date.toLocaleDateString('es-ES', options);

  return { timeString, dateString };
}
