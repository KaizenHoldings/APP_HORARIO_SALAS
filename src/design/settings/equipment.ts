/** Equipamiento posible de una sala. */
export type EquipmentId = 'tv' | 'owl' | 'charge' | 'share' | 'hdmi';

export const EQUIPMENT: { id: EquipmentId; label: string }[] = [
  { id: 'tv', label: 'Pantalla' },
  { id: 'owl', label: 'Meeting Owl' },
  { id: 'charge', label: 'Estación de carga' },
  { id: 'share', label: 'Clickshare' },
  { id: 'hdmi', label: 'HDMI' },
];

export const equipmentLabel = (id: EquipmentId) =>
  EQUIPMENT.find((e) => e.id === id)?.label ?? id;
