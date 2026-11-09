import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { EquipmentIcon } from '@/design/components/equipment-icon';
import { GlassSurface } from '@/design/components/glass-surface';
import { STATE_LABEL } from '@/design/components/room-status-hero';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import type { PhotoSource } from '@/design/room-photos';
import { type EquipmentId, equipmentLabel } from '@/design/settings/equipment';
import { font, space } from '@/design/tokens';
import type { RoomState } from '@/utils/room-status';

export const ROOM_CARD_WIDTH = 300;

export interface RoomCardData {
  email: string;
  name: string;
  photo: PhotoSource;
  state: RoomState;
  /** "Libre hasta las 1:00 PM", "Ocupada hasta las 11:30 AM"… */
  line: string;
  capacity?: number;
  equipment: EquipmentId[];
}

/** Tarjeta de vidrio de una sala para "Otras salas". */
export function RoomCard({ room }: { room: RoomCardData }) {
  const { colors, status } = useVisualTheme();
  const tone = status[room.state];

  return (
    <GlassSurface strong radius={24} style={styles.card} contentStyle={styles.content}>
      <View style={styles.photo}>
        <Image source={room.photo} contentFit="cover" transition={300} style={StyleSheet.absoluteFill} />
        <View style={styles.chip}>
          <View style={[styles.chipDot, { backgroundColor: tone.main }]} />
          <Text style={styles.chipText}>{STATE_LABEL[room.state]}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.ink }]}>
          {room.name}
        </Text>
        <Text numberOfLines={1} style={[styles.line, { color: colors.inkSecondary }]}>
          {room.line}
        </Text>
        {room.capacity ? (
          <View style={styles.meta}>
            <Ionicons name="people-outline" size={16} color={colors.inkSecondary} />
            <Text style={[styles.metaText, { color: colors.inkSecondary }]}>
              {room.capacity} personas
            </Text>
          </View>
        ) : null}
        {room.equipment.length ? (
          <View style={styles.equip}>
            {room.equipment.map((id) => (
              <View key={id} style={[styles.eq, { backgroundColor: colors.ink + '14' }]}>
                <EquipmentIcon id={id} color={colors.ink} />
                <Text style={[styles.eqText, { color: colors.ink }]}>{equipmentLabel(id)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: { width: ROOM_CARD_WIDTH },
  content: { padding: 12, gap: 12 },
  photo: { height: 172, borderRadius: 16, overflow: 'hidden' },
  chip: {
    position: 'absolute',
    left: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(8,14,28,0.55)',
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: '#FFFFFF', fontSize: 12, ...font.medium, letterSpacing: 0.2 },
  body: { paddingHorizontal: 6, paddingBottom: 6, gap: 4 },
  name: { fontSize: 22, lineHeight: 28, ...font.regular, letterSpacing: -0.2 },
  line: { fontSize: 14, ...font.regular },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  metaText: { fontSize: 13, ...font.regular },
  equip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  eq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  eqText: { fontSize: 12, ...font.medium },
});
