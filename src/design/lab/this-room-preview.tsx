import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppFrame } from '@/design/components/app-frame';
import { ThisRoomView } from '@/design/components/this-room-view';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { useLabScene } from '@/design/lab/lab-scene';
import { roomPhoto } from '@/design/room-photos';
import { type } from '@/design/tokens';
import type { EventoSala } from '@/types/agenda';

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

export function ThisRoomPreview() {
  const scene = useLabScene() ?? 'occupied';
  const now = useMemo(() => {
    const time = SCENE_TIME[scene];
    if (!time) return null;
    const d = new Date();
    d.setHours(time[0], time[1], 0, 0);
    return d;
  }, [scene]);

  return (
    <AppFrame
      renderView={(view) =>
        view === 'this' ? (
          <ThisRoomView
            roomName="Sala SOCADO"
            eventos={MOCK_EVENTOS}
            photo={roomPhoto('sala.socado@kaizenholdings.net')}
            now={now}
          />
        ) : (
          <OthersPlaceholder />
        )
      }
    />
  );
}

function OthersPlaceholder() {
  const { colors } = useVisualTheme();
  return (
    <View style={styles.center} pointerEvents="none">
      <Text style={[type.title, { color: colors.inkSecondary }]}>Otras salas (próximo paso)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
