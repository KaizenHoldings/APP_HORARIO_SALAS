import { useMemo } from 'react';

import { AppFrame } from '@/design/components/app-frame';
import { OtherRoomsView } from '@/design/components/other-rooms-view';
import type { RoomCardData } from '@/design/components/room-card';
import { ThisRoomView } from '@/design/components/this-room-view';
import { useLabScene } from '@/design/lab/lab-scene';
import { GALLERY } from '@/design/room-photos';
import type { EventoSala } from '@/types/agenda';
import { getRoomStatus, minutesOfDay, statusLine, toScheduleBlocks } from '@/utils/room-status';

/** Escenas: hora simulada para ver cada estado. `live` usa el reloj real. */
export const THIS_ROOM_SCENES = [
  { id: 'occupied', label: 'Ocupada' },
  { id: 'soon', label: 'Por ocuparse' },
  { id: 'available', label: 'Disponible' },
  { id: 'live', label: 'En vivo' },
];
const SCENE_TIME: Record<string, [number, number]> = {
  occupied: [10, 45],
  soon: [12, 50],
  available: [12, 0],
};

const ev = (
  titulo: string,
  desde: string,
  hasta: string,
  organizador: string | null = null,
  correo: string | null = null,
): EventoSala => ({
  id: organizador ? `mock-${desde}` : null,
  titulo,
  organizador,
  correo_organizador: correo,
  fecha: '',
  desde,
  hasta,
  zona_horaria: 'America/Caracas',
});

/** Agenda de ejemplo con el mismo formato que devuelve el backend. */
const MOCK_EVENTOS: EventoSala[] = [
  ev('Disponible', '08:00 AM', '06:00 PM'),
  ev('Daily de operaciones', '09:00 AM', '10:00 AM', 'Manuel Chacin', 'mchacin@kaizenholdings.net'),
  ev('Revisión semanal de ventas', '10:30 AM', '11:30 AM', 'Yotziel Melean', 'ymelean@kaizenholdings.net'),
  ev('Comité de producto', '01:00 PM', '02:30 PM', 'Manuel Chacin', 'mchacin@kaizenholdings.net'),
  ev('1:1 Dirección', '03:30 PM', '04:00 PM', 'Yotziel Melean', 'ymelean@kaizenholdings.net'),
];
const BLOCKS = toScheduleBlocks(MOCK_EVENTOS);

/** Otras salas de ejemplo para el laboratorio. */
const MOCK_OTHERS: { email: string; name: string; eventos: EventoSala[]; photo: number; capacity: number; equipment: RoomCardData['equipment'] }[] = [
  { email: 'principal@demo', name: 'Sala Principal', photo: GALLERY[1].source, capacity: 16, equipment: ['tv', 'owl', 'share', 'charge', 'hdmi'],
    eventos: [ev('Disponible', '08:00 AM', '06:00 PM'), ev('Planificación trimestral', '10:00 AM', '12:00 PM', 'Manuel Chacin')] },
  { email: 'innovacion@demo', name: 'Sala Innovación', photo: GALLERY[2].source, capacity: 8, equipment: ['tv', 'hdmi'],
    eventos: [ev('Disponible', '08:00 AM', '06:00 PM'), ev('Workshop de diseño', '01:00 PM', '02:00 PM', 'Yotziel Melean')] },
  { email: 'directorio@demo', name: 'Sala Directorio', photo: GALLERY[1].source, capacity: 12, equipment: ['tv', 'owl', 'charge', 'share'],
    eventos: [ev('Disponible', '08:00 AM', '06:00 PM'), ev('Comité directivo', '08:00 AM', '09:00 AM', 'Manuel Chacin')] },
  { email: 'creativa@demo', name: 'Sala Creativa', photo: GALLERY[3].source, capacity: 6, equipment: ['tv', 'charge'],
    eventos: [ev('Disponible', '08:00 AM', '06:00 PM'), ev('Entrevistas', '10:30 AM', '12:30 PM', 'Manuel Chacin')] },
];

export function ThisRoomPreview() {
  const scene = useLabScene() ?? 'occupied';
  const now = useMemo(() => {
    const time = SCENE_TIME[scene];
    if (!time) return null;
    const d = new Date();
    d.setHours(time[0], time[1], 0, 0);
    return d;
  }, [scene]);
  const minute = minutesOfDay(now ?? new Date());

  const others: RoomCardData[] = MOCK_OTHERS.map((r) => {
    const info = getRoomStatus(toScheduleBlocks(r.eventos), minute);
    return { email: r.email, name: r.name, photo: r.photo, state: info.state, line: statusLine(info), capacity: r.capacity, equipment: r.equipment };
  });

  return (
    <AppFrame
      adminRooms={[{ email: 'socado@demo', name: 'Sala SOCADO', state: getRoomStatus(BLOCKS, minute).state }, ...others.map((o) => ({ email: o.email, name: o.name, state: o.state }))]}
      renderView={(view) =>
        view === 'this' ? (
          <ThisRoomView roomName="Sala SOCADO" blocks={BLOCKS} photo={GALLERY[0].source} now={now} />
        ) : (
          <OtherRoomsView rooms={others} />
        )
      }
    />
  );
}
