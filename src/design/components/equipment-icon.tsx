import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { EquipmentId } from '@/design/settings/equipment';

/** Icono de línea de cada equipamiento (mismo trazo que el resto de la interfaz). */
export function EquipmentIcon({
  id,
  size = 14,
  color,
}: {
  id: EquipmentId;
  size?: number;
  color: string;
}) {
  const stroke = { stroke: color, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {id === 'tv' ? (
        <>
          <Rect x={2} y={4} width={20} height={13} rx={2} {...stroke} />
          <Path d="M8 21h8M12 17v4" {...stroke} />
        </>
      ) : null}
      {id === 'owl' ? (
        <>
          <Circle cx={12} cy={10} r={7} {...stroke} />
          <Circle cx={12} cy={10} r={2.5} {...stroke} />
          <Path d="M8 21h8M12 17v4" {...stroke} />
        </>
      ) : null}
      {id === 'charge' ? <Path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" {...stroke} /> : null}
      {id === 'share' ? (
        <>
          <Path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" {...stroke} />
          <Path d="M2 12a9 9 0 0 1 8 8M2 16a5 5 0 0 1 4 4" {...stroke} />
          <Path d="M2 20h.01" {...stroke} />
        </>
      ) : null}
      {id === 'hdmi' ? (
        <>
          <Path d="M3 8h18v5l-3 3H6l-3-3z" {...stroke} />
          <Path d="M8 11.5h8" {...stroke} />
        </>
      ) : null}
    </Svg>
  );
}
