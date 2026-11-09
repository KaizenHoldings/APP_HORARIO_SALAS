/**
 * CodeSlots — entrada de código de un solo uso.
 * Port de React Bits (https://reactbits.dev/micro/code-slots, variante JS-CSS) a React Native
 * con Reanimated, para que funcione igual en web, Android e iOS.
 *
 * Se conserva la API y las animaciones del original:
 * - los dígitos caen a su casilla con resorte (`settle`, `bounce`, `rise`) y en cascada (`cascade`);
 * - en `error` las casillas se tiñen de rojo y se vacían en cascada inversa;
 * - en `success` una franja (`accentColor`) se abre desde el centro, los dígitos se hunden
 *   y aparece un check.
 *
 * Diferencias: la entrada es un TextInput invisible (teclado numérico del sistema, pegar y
 * autocompletar SMS); el cursor siempre está en la siguiente casilla vacía; no hay `value`
 * controlado; el check usa Ionicons en lugar de Hugeicons.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { font, numbers } from '@/design/tokens/typography';

export type CodeSlotsStatus = 'idle' | 'success' | 'error';

export interface CodeSlotsProps {
  length?: number;
  defaultValue?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  status?: CodeSlotsStatus;
  mask?: boolean;
  caret?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  accentColor?: string;
  inkColor?: string;
  slotColor?: string;
  digitColor?: string;
  dangerColor?: string;
  slotSize?: number;
  gap?: number;
  radius?: number;
  bounce?: number;
  settle?: number;
  rise?: number;
  cascade?: number;
  accessibilityLabel?: string;
}

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const SINK_DELAY = 60;
const SINK_STEP = 30;
const CHECK_DELAY = 280;
const CHECK_RISE = 8;
const SINK_FADE = 0.6;

const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const clamp01 = (v: number) => {
  'worklet';
  return Math.min(1, Math.max(0, v));
};
const digitsOf = (raw: string) => raw.replace(/\D/g, '');

/** Mezcla `a` sobre `b` en proporción `t` (hex #rrggbb), como `color-mix(in srgb, a t, b)`. */
function mix(a: string, b: string, t: number) {
  const parse = (h: string) => {
    const n = parseInt(h.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const c = (x: number, y: number) => Math.round(x * t + y * (1 - t));
  return `rgb(${c(ar, br)}, ${c(ag, bg)}, ${c(ab, bb)})`;
}

export function CodeSlots({
  length = 6,
  defaultValue = '',
  onChange,
  onComplete,
  status = 'idle',
  mask = false,
  caret = true,
  disabled = false,
  autoFocus = false,
  accentColor = '#f5f5f5',
  inkColor = '#f5f5f5',
  slotColor = '#27272a',
  digitColor = '#18181b',
  dangerColor = '#ff3b30',
  slotSize = 44,
  gap = 8,
  radius = 12,
  bounce = 0.2,
  settle = 0.3,
  rise = 8,
  cascade = 20,
  accessibilityLabel = 'Código',
}: CodeSlotsProps) {
  const reduce = useReducedMotion();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState(() => digitsOf(defaultValue).slice(0, length));
  const [delays, setDelays] = useState<number[]>(() => Array(length).fill(0));
  const [draining, setDraining] = useState(false);
  const [focused, setFocused] = useState(false);
  const drainTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pitch = slotSize + gap;
  const height = Math.round(slotSize * 1.18);
  const rowWidth = length * slotSize + (length - 1) * gap;
  const washRadius = Math.min(radius, slotSize / 2);
  const step = reduce ? 0 : cascade;
  const spring = { duration: reduce ? 1 : settle * 1000, dampingRatio: 1 - bounce };
  const active = Math.min(code.length, length - 1);

  const commit = (next: string, nextDelays: number[]) => {
    const prev = code;
    setDelays(nextDelays);
    setCode(next);
    onChange?.(next);
    if (prev.length < length && next.length === length) onComplete?.(next);
  };

  const onChangeText = (text: string) => {
    if (disabled || draining || status === 'success') return;
    const next = digitsOf(text).slice(0, length);
    if (next === code) return;
    const nextDelays = Array.from({ length }, (_, i) =>
      i >= code.length && i < next.length ? (i - code.length) * step : 0,
    );
    commit(next, nextDelays);
  };

  // Error: vaciado en cascada inversa. Se decide durante el render al cambiar `status`
  // (patrón "estado derivado del render anterior"), y un temporizador borra el código al final.
  const [lastStatus, setLastStatus] = useState(status);
  if (status !== lastStatus) {
    setLastStatus(status);
    if (status === 'error' && code.length > 0) {
      const filled = code.length;
      setDelays(Array.from({ length }, (_, i) => (i < filled ? (filled - 1 - i) * step : 0)));
      setDraining(true);
    }
  }

  useEffect(() => {
    if (!draining) return;
    const filled = code.length;
    drainTimer.current = setTimeout(
      () => {
        setDraining(false);
        setDelays(Array(length).fill(0));
        setCode('');
        onChange?.('');
      },
      reduce ? 300 : Math.max(0, filled - 1) * step + settle * 1000,
    );
    return () => clearTimeout(drainTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draining]);

  // Éxito: franja que se abre desde el centro + check.
  const open = useSharedValue(status === 'success' ? 1 : 0);
  const check = useSharedValue(status === 'success' ? 1 : 0);
  const prevStatus = useRef(status);

  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = status;
    if (status === 'success') {
      inputRef.current?.blur();
      open.set(reduce ? 1 : withTiming(1, { duration: 300, easing: EASE_OUT }));
      check.set(
        reduce ? 1 : withDelay(CHECK_DELAY, withSpring(1, { duration: 350, dampingRatio: 1 - bounce })),
      );
    } else if (was === 'success') {
      check.set(reduce ? 0 : withTiming(0, { duration: 150, easing: EASE_OUT }));
      open.set(reduce ? 0 : withDelay(60, withTiming(0, { duration: 200, easing: EASE_OUT })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const washStyle = useAnimatedStyle(() => {
    const o = clamp01(open.value);
    return { left: ((1 - o) * rowWidth) / 2, width: o * rowWidth, opacity: o > 0 ? 1 : 0 };
  });
  const checkStyle = useAnimatedStyle(() => ({
    opacity: clamp01(check.value),
    transform: [
      { translateY: (1 - check.value) * CHECK_RISE },
      { scale: 0.85 + 0.15 * Math.max(check.value, 0) },
    ],
  }));

  // Cursor: se desliza a la casilla activa y parpadea.
  const caretX = useSharedValue(active * pitch);
  const blink = useSharedValue(1);
  useEffect(() => {
    caretX.set(reduce ? active * pitch : withSpring(active * pitch, spring));
    blink.set(1);
    if (!reduce) {
      blink.set(
        withRepeat(
          withSequence(
            withDelay(500, withTiming(0, { duration: 0 })),
            withDelay(500, withTiming(1, { duration: 0 })),
          ),
          -1,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, pitch, reduce]);
  const caretStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: caretX.value }],
    opacity: blink.value,
  }));
  const showCaret =
    caret &&
    focused &&
    !disabled &&
    status !== 'success' &&
    (status === 'error' || !code[active]);

  return (
    <View style={[styles.row, { gap, height, width: rowWidth }, disabled && styles.disabled]}>
      {Array.from({ length }, (_, i) => (
        <Slot
          key={i}
          char={mask && code[i] ? '•' : (code[i] ?? '')}
          on={!!code[i] && !draining}
          delay={delays[i] ?? 0}
          sunk={status === 'success'}
          sinkDelay={reduce ? 0 : SINK_DELAY + i * SINK_STEP}
          active={focused && i === active && status !== 'success'}
          error={status === 'error'}
          spring={spring}
          reduce={reduce}
          rise={rise}
          sink={Math.round(height * 0.5)}
          size={slotSize}
          height={height}
          radius={washRadius}
          slotColor={slotColor}
          inkColor={inkColor}
          accentColor={accentColor}
          digitColor={digitColor}
          dangerColor={dangerColor}
        />
      ))}

      <Animated.View
        pointerEvents="none"
        style={[styles.wash, { borderRadius: washRadius, backgroundColor: accentColor }, washStyle]}
      />
      <Animated.View pointerEvents="none" style={[styles.center, checkStyle]}>
        <Ionicons name="checkmark" size={Math.round(slotSize * 0.6)} color={digitColor} />
      </Animated.View>

      {showCaret ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.caret,
            {
              left: slotSize / 2 - 0.75,
              top: height * 0.25,
              height: height * 0.5,
              backgroundColor: inkColor,
            },
            caretStyle,
          ]}
        />
      ) : null}

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled && status !== 'success'}
        autoFocus={autoFocus}
        maxLength={length}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        caretHidden
        disableFullscreenUI
        selectionColor="transparent"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          text: status === 'success' ? 'Código aceptado' : `${code.length} de ${length} dígitos`,
        }}
        style={styles.input}
      />
    </View>
  );
}

function Slot({
  char,
  on,
  delay,
  sunk,
  sinkDelay,
  active,
  error,
  spring,
  reduce,
  rise,
  sink,
  size,
  height,
  radius,
  slotColor,
  inkColor,
  accentColor,
  digitColor,
  dangerColor,
}: {
  char: string;
  on: boolean;
  delay: number;
  sunk: boolean;
  sinkDelay: number;
  active: boolean;
  error: boolean;
  spring: { duration: number; dampingRatio: number };
  reduce: boolean;
  rise: number;
  sink: number;
  size: number;
  height: number;
  radius: number;
  slotColor: string;
  inkColor: string;
  accentColor: string;
  digitColor: string;
  dangerColor: string;
}) {
  // Conserva el último dígito para que pueda animarse al salir.
  const [shown, setShown] = useState(char);
  if (char && char !== shown) setShown(char);

  const fill = useSharedValue(on ? 1 : 0);
  const drop = useSharedValue(sunk ? 1 : 0);
  const wasOn = useRef(on);

  useEffect(() => {
    if (on === wasOn.current) return;
    wasOn.current = on;
    if (reduce) {
      fill.set(on ? 1 : 0);
      return;
    }
    if (on) fill.set(0);
    fill.set(withDelay(delay, withSpring(on ? 1 : 0, spring)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  useEffect(() => {
    const to = sunk ? 1 : 0;
    drop.set(
      reduce
        ? to
        : withDelay(sunk ? sinkDelay : 100, withSpring(to, { duration: 300, dampingRatio: 1 })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sunk]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scale: Math.max(fill.value, 0) }] }));
  const digitStyle = useAnimatedStyle(() => ({
    opacity: clamp01(fill.value) * (1 - clamp01(drop.value / SINK_FADE)),
    transform: [{ translateY: (1 - fill.value) * rise + Math.max(drop.value, 0) * sink }],
  }));

  const background = error
    ? mix(dangerColor, slotColor, 0.2)
    : active
      ? mix(inkColor, slotColor, 0.08)
      : slotColor;

  return (
    <Animated.View
      style={[
        styles.slot,
        {
          width: size,
          height,
          borderRadius: radius,
          backgroundColor: background,
          transitionProperty: 'backgroundColor',
          transitionDuration: 200,
        },
      ]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            backgroundColor: error ? dangerColor : accentColor,
            transitionProperty: 'backgroundColor',
            transitionDuration: 200,
          },
          fillStyle,
        ]}
      />
      {shown ? (
        <Animated.Text
          style={[
            styles.digit,
            { color: digitColor, fontSize: Math.round(size * 0.5), lineHeight: height },
            digitStyle,
          ]}>
          {shown}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  disabled: { opacity: 0.5 },
  slot: { overflow: 'hidden' },
  digit: {
    ...FILL,
    textAlign: 'center',
    ...font.medium,
    ...numbers,
  },
  wash: { position: 'absolute', top: 0, bottom: 0 },
  center: { ...FILL, alignItems: 'center', justifyContent: 'center' },
  caret: { position: 'absolute', width: 1.5 },
  input: {
    ...FILL,
    opacity: 0.011,
    color: 'transparent',
    fontSize: 16,
  },
});
