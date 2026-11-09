import { Ionicons } from '@expo/vector-icons';
import { Directory, File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { type ReactNode, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BRANDS } from '@/design/brands';
import { BrandMark } from '@/design/components/brand-mark';
import { EquipmentIcon } from '@/design/components/equipment-icon';
import { STATE_LABEL } from '@/design/components/room-status-hero';
import { SegmentedSwitch } from '@/design/components/segmented-switch';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { GALLERY, galleryRef, resolvePhoto } from '@/design/room-photos';
import { EQUIPMENT, type EquipmentId } from '@/design/settings/equipment';
import { roomMetaOf, useKioskSettings } from '@/design/settings/kiosk-settings';
import { COLOR_PRESETS, COLOR_ROWS, ORIGINAL_COLORS, sameColor } from '@/design/settings/palette';
import { font, numbers, radius, space } from '@/design/tokens';
import type { RoomState } from '@/utils/room-status';

export interface AdminRoomInfo {
  email: string;
  name: string;
  state: RoomState;
}

type Tab = 'brand' | 'screen' | 'rooms' | 'colors';
const TABS: { id: Tab; label: string }[] = [
  { id: 'brand', label: 'Marca' },
  { id: 'screen', label: 'Pantalla' },
  { id: 'rooms', label: 'Salas' },
  { id: 'colors', label: 'Colores' },
];

/** Elige una foto del equipo y la copia a los documentos de la app (persistente). */
async function pickRoomPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const uri = result.assets[0].uri;
  if (Platform.OS === 'web') return uri;
  const dir = new Directory(Paths.document, 'room-photos');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const dest = new File(dir, `${Date.now()}.jpg`);
  await new File(uri).copy(dest);
  return dest.uri;
}

/**
 * Consola de administración (tras el código): Marca, Pantalla (sala de esta tablet),
 * Salas (foto, equipamiento y capacidad de las salas del sistema) y Colores.
 * Todo se guarda en la tablet (kiosk-settings).
 */
export function AdminConsole({ rooms }: { rooms: AdminRoomInfo[] }) {
  const [tab, setTab] = useState<Tab>('brand');
  return (
    <View style={styles.root}>
      <SegmentedSwitch options={TABS} value={tab} onChange={setTab} segmentWidth={112} accessibilityLabel="Secciones de administración" />
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Animated.View key={tab} entering={FadeIn.duration(250)} style={styles.pane}>
          {tab === 'brand' ? <BrandTab /> : null}
          {tab === 'screen' ? <ScreenTab rooms={rooms} /> : null}
          {tab === 'rooms' ? <RoomsTab rooms={rooms} /> : null}
          {tab === 'colors' ? <ColorsTab /> : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function BrandTab() {
  const { colors } = useVisualTheme();
  const { settings, setBrand } = useKioskSettings();
  return (
    <Section label="ISOTIPO DE LA PANTALLA">
      <View style={styles.grid}>
        {BRANDS.map((b) => {
          const on = b.id === settings.brand;
          return (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setBrand(b.id)}
              style={[styles.brand, { borderColor: on ? colors.ink : colors.ink + '1F', backgroundColor: colors.ink + '0D' }, on && { borderWidth: 2 }]}>
              <BrandMark brand={b} size={48} />
              <Text style={[styles.brandName, { color: colors.ink }]}>{b.name}</Text>
              {on ? <Tick /> : null}
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}

function ScreenTab({ rooms }: { rooms: AdminRoomInfo[] }) {
  const { colors, status } = useVisualTheme();
  const { settings, setRoomEmail } = useKioskSettings();
  const current = settings.roomEmail ?? rooms[0]?.email;
  return (
    <Section label="SALA QUE MUESTRA ESTA TABLET">
      {rooms.length === 0 ? <Empty /> : null}
      <View style={styles.list}>
        {rooms.map((r) => {
          const on = r.email === current;
          const meta = roomMetaOf(settings, r.email);
          return (
            <Pressable
              key={r.email}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setRoomEmail(r.email)}
              style={[styles.option, { borderColor: on ? colors.ink : colors.ink + '1F', backgroundColor: colors.ink + '0D' }]}>
              <View style={styles.optionText}>
                <Text style={[styles.optionName, { color: colors.ink }]}>{r.name}</Text>
                <View style={styles.optionSub}>
                  <View style={[styles.dot, { backgroundColor: status[r.state].main }]} />
                  <Text style={[styles.optionSubText, { color: colors.inkSecondary }]}>
                    {STATE_LABEL[r.state]}
                    {meta.capacity ? ` · ${meta.capacity} personas` : ''}
                  </Text>
                </View>
              </View>
              <View style={[styles.radio, { borderColor: on ? colors.ink : colors.inkMuted }]}>
                {on ? <View style={[styles.radioDot, { backgroundColor: colors.ink }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Section>
  );
}

function RoomsTab({ rooms }: { rooms: AdminRoomInfo[] }) {
  const { colors, isDark } = useVisualTheme();
  const { settings, updateRoom } = useKioskSettings();
  const [editEmail, setEditEmail] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const room = rooms.find((r) => r.email === editEmail) ?? rooms[0];
  if (!room) return <Empty />;
  const meta = roomMetaOf(settings, room.email);

  const toggle = (id: EquipmentId) =>
    updateRoom(room.email, {
      equipment: meta.equipment.includes(id) ? meta.equipment.filter((x) => x !== id) : [...meta.equipment, id],
    });

  const upload = async () => {
    try {
      setUploading(true);
      const uri = await pickRoomPhoto();
      if (uri) updateRoom(room.email, { photo: uri });
    } catch (error) {
      console.warn('No se pudo guardar la foto:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <View style={styles.sync}>
        <Ionicons name="sync-outline" size={14} color={colors.inkMuted} />
        <Text style={[styles.syncText, { color: colors.inkMuted }]}>Salas sincronizadas desde el sistema</Text>
      </View>
      <Section label="SALA">
        <View style={styles.chips}>
          {rooms.map((r) => (
            <Chip key={r.email} label={r.name} on={r.email === room.email} onPress={() => setEditEmail(r.email)} />
          ))}
        </View>
      </Section>
      <Section label="IMAGEN">
        <View style={styles.preview}>
          <Image source={resolvePhoto(meta.photo)} contentFit="cover" transition={250} style={StyleSheet.absoluteFill} />
        </View>
        <View style={styles.thumbs}>
          {GALLERY.map((g, i) => {
            const ref = galleryRef(i);
            const on = (meta.photo ?? galleryRef(0)) === ref;
            return (
              <Pressable
                key={ref}
                accessibilityRole="button"
                accessibilityLabel={g.label}
                accessibilityState={{ selected: on }}
                onPress={() => updateRoom(room.email, { photo: ref })}
                style={[styles.thumb, { borderColor: on ? colors.ink : 'transparent' }]}>
                <Image source={g.source} contentFit="cover" style={StyleSheet.absoluteFill} />
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Subir una foto"
            onPress={upload}
            disabled={uploading}
            style={[styles.thumb, styles.upload, { borderColor: colors.inkMuted }]}>
            <Ionicons name={uploading ? 'hourglass-outline' : 'cloud-upload-outline'} size={16} color={colors.inkSecondary} />
            <Text style={[styles.uploadText, { color: colors.inkSecondary }]}>Subir</Text>
          </Pressable>
        </View>
      </Section>
      <Section label="EQUIPAMIENTO">
        <View style={styles.chips}>
          {EQUIPMENT.map((e) => {
            const on = meta.equipment.includes(e.id);
            return (
              <Chip key={e.id} label={e.label} on={on} onPress={() => toggle(e.id)}>
                <EquipmentIcon id={e.id} color={on ? (isDark ? '#0B1220' : '#FFFFFF') : colors.ink} />
              </Chip>
            );
          })}
        </View>
      </Section>
      <Section label="CAPACIDAD">
        <View style={styles.stepper}>
          <RoundButton icon="remove" label="Menos personas" onPress={() => updateRoom(room.email, { capacity: Math.max(1, (meta.capacity ?? 1) - 1) })} />
          <Text style={[styles.stepValue, { color: colors.ink }]}>{meta.capacity ?? '—'}</Text>
          <RoundButton icon="add" label="Más personas" onPress={() => updateRoom(room.email, { capacity: Math.min(60, (meta.capacity ?? 0) + 1) })} />
          <Text style={[styles.syncText, { color: colors.inkMuted }]}>personas</Text>
        </View>
      </Section>
    </>
  );
}

function ColorsTab() {
  const { colors } = useVisualTheme();
  const { settings, setColor, resetColors } = useKioskSettings();
  const isOriginal = (Object.keys(ORIGINAL_COLORS) as (keyof typeof ORIGINAL_COLORS)[]).every((k) =>
    sameColor(settings.colors[k], ORIGINAL_COLORS[k]),
  );
  return (
    <>
      {COLOR_ROWS.map((row, i) => {
        const value = settings.colors[row.key];
        const showGroup = i === 0 || COLOR_ROWS[i - 1].group !== row.group;
        return (
          <View key={row.key} style={styles.colorItem}>
            {showGroup ? <Text style={[styles.sectionLabel, { color: colors.inkMuted }]}>{row.group}</Text> : null}
            <View style={[styles.colorLine, { backgroundColor: colors.ink + '0D', borderColor: colors.ink + '1F' }]}>
              <View style={[styles.colorNow, { backgroundColor: value }]} />
              <Text style={[styles.colorName, { color: colors.ink }]}>{row.label}</Text>
              <View style={styles.swatches}>
                {COLOR_PRESETS[row.key].map((hex) => {
                  const on = sameColor(hex, value);
                  return (
                    <Pressable
                      key={hex}
                      accessibilityRole="button"
                      accessibilityLabel={`${row.label} ${hex}`}
                      accessibilityState={{ selected: on }}
                      hitSlop={6}
                      onPress={() => setColor(row.key, hex)}
                      style={[styles.swatch, { backgroundColor: hex }, on && { borderWidth: 2, borderColor: colors.ink, transform: [{ scale: 1.1 }] }]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        );
      })}
      <Pressable
        accessibilityRole="button"
        onPress={resetColors}
        disabled={isOriginal}
        style={[styles.reset, { borderColor: colors.ink + '26', backgroundColor: colors.ink + '0D', opacity: isOriginal ? 0.45 : 1 }]}>
        <Ionicons name="refresh-outline" size={18} color={colors.ink} />
        <Text style={[styles.resetText, { color: colors.ink }]}>Restaurar colores originales</Text>
      </Pressable>
    </>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  const { colors } = useVisualTheme();
  return (
    <View>
      <Text style={[styles.sectionLabel, { color: colors.inkMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, on, onPress, children }: { label: string; on: boolean; onPress: () => void; children?: ReactNode }) {
  const { colors, isDark } = useVisualTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, { borderColor: on ? colors.ink : colors.ink + '1F', backgroundColor: on ? colors.ink : colors.ink + '0D' }]}>
      {children}
      <Text style={[styles.chipText, { color: on ? (isDark ? '#0B1220' : '#FFFFFF') : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

function RoundButton({ icon, label, onPress }: { icon: 'add' | 'remove'; label: string; onPress: () => void }) {
  const { colors } = useVisualTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={onPress} style={[styles.round, { backgroundColor: colors.ink + '14' }]}>
      <Ionicons name={icon} size={18} color={colors.ink} />
    </Pressable>
  );
}

function Tick() {
  const { colors, isDark } = useVisualTheme();
  return (
    <View style={[styles.tick, { backgroundColor: colors.ink }]}>
      <Ionicons name="checkmark" size={14} color={isDark ? '#0B1220' : '#FFFFFF'} />
    </View>
  );
}

function Empty() {
  const { colors } = useVisualTheme();
  return <Text style={[styles.syncText, { color: colors.inkSecondary }]}>Aún no hay salas cargadas desde el sistema.</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: space.lg },
  body: { flex: 1, marginHorizontal: -space.lg },
  bodyContent: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  pane: { gap: space.lg },
  sectionLabel: { fontSize: 12, ...font.medium, letterSpacing: 1.4, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  brand: {
    width: '48%',
    flexGrow: 1,
    height: 124,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  brandName: { fontSize: 14, ...font.medium },
  tick: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  optionText: { flex: 1, gap: 2 },
  optionName: { fontSize: 16, ...font.medium },
  optionSub: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionSubText: { fontSize: 13, ...font.regular },
  dot: { width: 8, height: 8, borderRadius: 4 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  sync: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncText: { fontSize: 12, ...font.regular },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, ...font.medium },
  preview: { height: 180, borderRadius: 16, overflow: 'hidden' },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  thumb: { width: 72, height: 52, borderRadius: 10, overflow: 'hidden', borderWidth: 2 },
  upload: { borderStyle: 'dashed', borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  uploadText: { fontSize: 11, ...font.medium },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepValue: { minWidth: 40, textAlign: 'center', fontSize: 22, ...font.regular, ...numbers },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  colorItem: { gap: 0 },
  colorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  colorNow: { width: 28, height: 28, borderRadius: 14 },
  colorName: { flex: 1, fontSize: 14, ...font.medium },
  swatches: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 22, height: 22, borderRadius: 11 },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 48,
    borderRadius: 22,
    borderWidth: 1,
  },
  resetText: { fontSize: 15, ...font.medium },
});
