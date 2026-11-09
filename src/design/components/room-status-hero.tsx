import { useId } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { PulseDot } from '@/design/components/pulse-dot';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { font, space } from '@/design/tokens';
import { formatMinutes, type RoomState, type RoomStatusInfo } from '@/utils/room-status';

export const STATE_LABEL: Record<RoomState, string> = {
  available: 'Disponible',
  soon: 'Por ocuparse',
  occupied: 'Ocupada',
};

const EASE = Easing.bezier(0.23, 1, 0.32, 1);

/** Texto de apoyo bajo el estado: qué pasa ahora y hasta cuándo. */
function describe(info: RoomStatusInfo): { primary: string; secondary: string | null } {
  const { state, current, next, until, minutesLeft } = info;
  if (state === 'occupied' && current) {
    return {
      primary: current.title,
      secondary: [`Hasta las ${formatMinutes(until ?? current.end)}`, current.organizer]
        .filter(Boolean)
        .join(' · '),
    };
  }
  if (state === 'soon' && next) {
    return {
      primary: `Reunión a las ${formatMinutes(next.start)}`,
      secondary: `En ${minutesLeft} min · ${next.title}`,
    };
  }
  return {
    primary: until !== null ? `Libre hasta las ${formatMinutes(until)}` : 'Libre el resto del día',
    secondary: next ? `Próxima: ${next.title}` : null,
  };
}

/**
 * Bloque principal izquierdo: nombre de la sala y estado en su color (verde / naranja / rojo),
 * con un resplandor del color del estado detrás. Legible a distancia.
 */
export function RoomStatusHero({ roomName, info }: { roomName: string; info: RoomStatusInfo }) {
  const { colors, status, isDark } = useVisualTheme();
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const tone = status[info.state];
  const ink = isDark ? tone.textDark : tone.textLight;
  const { primary, secondary } = describe(info);

  return (
    <View style={styles.root}>
      <Animated.View
        key={info.state}
        entering={FadeIn.duration(700)}
        exiting={FadeOut.duration(700)}
        pointerEvents="none"
        style={styles.glow}>
        <Glow color={tone.main} strength={isDark ? 0.34 : 0.22} />
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.duration(600).delay(150).easing(EASE)}
        numberOfLines={2}
        adjustsFontSizeToFit
        style={[styles.name, compact && styles.nameCompact, { color: colors.ink }]}>
        {roomName}
      </Animated.Text>

      <Animated.View
        key={`state-${info.state}`}
        entering={FadeInDown.duration(520).delay(80).easing(EASE)}
        style={styles.stateRow}
        accessibilityRole="text"
        accessibilityLabel={`Estado: ${STATE_LABEL[info.state]}`}>
        <PulseDot color={tone.main} size={compact ? 14 : 18} />
        <Text style={[styles.state, compact && styles.stateCompact, { color: ink }]}>
          {STATE_LABEL[info.state]}
        </Text>
      </Animated.View>

      <Animated.View
        key={`detail-${primary}`}
        entering={FadeIn.duration(400).delay(200)}
        style={styles.detail}>
        <Text numberOfLines={2} style={[styles.primary, { color: colors.ink }]}>
          {primary}
        </Text>
        {secondary ? (
          <Text numberOfLines={1} style={[styles.secondary, { color: colors.inkSecondary }]}>
            {secondary}
          </Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

function Glow({ color, strength }: { color: string; strength: number }) {
  const id = `glow-${useId().replace(/:/g, '')}`;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id={id} cx="50" cy="50" rx="50" ry="50" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={color} stopOpacity={strength} />
          <Stop offset="0.45" stopColor={color} stopOpacity={strength * 0.45} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx="50" cy="50" rx="50" ry="50" fill={`url(#${id})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.md, justifyContent: 'center' },
  glow: { position: 'absolute', left: '-35%', top: '-45%', width: '150%', height: '190%' },
  name: { fontSize: 64, lineHeight: 70, ...font.light, letterSpacing: -1 },
  nameCompact: { fontSize: 44, lineHeight: 50, letterSpacing: -0.6 },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  state: { fontSize: 40, lineHeight: 46, ...font.regular, letterSpacing: -0.5 },
  stateCompact: { fontSize: 30, lineHeight: 36 },
  detail: { gap: space.xs, paddingTop: space.xs },
  primary: { fontSize: 22, lineHeight: 28, ...font.regular, letterSpacing: -0.1 },
  secondary: { fontSize: 17, lineHeight: 22, ...font.regular },
});
