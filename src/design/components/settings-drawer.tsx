import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactNode, useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  FadeOutRight,
  SlideInRight,
  SlideOutRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CodeSlots, type CodeSlotsStatus } from '@/design/components/code-slots';
import { GlassSurface } from '@/design/components/glass-surface';
import { SegmentedSwitch } from '@/design/components/segmented-switch';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import type { ThemePreference } from '@/design/theme/visual-theme';
import { codeSlots, radius, space, type } from '@/design/tokens';
import { ADMIN_CODE_LENGTH, verifyAdminCode } from '@/utils/admin';

type Page = 'main' | 'admin' | 'unlocked';
const ORDER: Record<Page, number> = { main: 0, admin: 1, unlocked: 2 };

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'system', label: 'Sistema' },
];

/**
 * Menú lateral de ajustes (entra desde la derecha como un panel de vidrio flotante).
 * - Apariencia: claro / oscuro / sistema (cambia toda la app).
 * - Admin: pide el código de acceso con CodeSlots.
 */
export function SettingsDrawer({
  open,
  onClose,
  onAdminUnlocked,
}: {
  open: boolean;
  onClose: () => void;
  onAdminUnlocked?: () => void;
}) {
  const { glass } = useVisualTheme();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState<Page>('main');
  const [direction, setDirection] = useState<1 | -1>(1);
  const insets = useSafeAreaInsets();
  const panelWidth = Math.min(400, width - space.md * 2);

  const go = (next: Page) => {
    setDirection(ORDER[next] > ORDER[page] ? 1 : -1);
    setPage(next);
  };

  // Al cerrar, vuelve a la página principal para la próxima apertura.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setPage('main'), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Botón "atrás" de Android: retrocede una página o cierra el menú.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (page === 'admin') go('main');
      else onClose();
      return true;
    });
    return () => sub.remove();
  });

  const enter = (direction === 1 ? FadeInRight : FadeInLeft).duration(280);
  const exit = (direction === 1 ? FadeOutLeft : FadeOutRight).duration(160);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {open ? (
        <Animated.View
          entering={FadeIn.duration(240)}
          exiting={FadeOut.duration(200)}
          style={[StyleSheet.absoluteFill, { backgroundColor: glass.scrim }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Cerrar ajustes"
          />
        </Animated.View>
      ) : null}

      {open ? (
        <Animated.View
          entering={SlideInRight.springify().damping(24).stiffness(220)}
          exiting={SlideOutRight.duration(220)}
          style={[
            styles.panelWrap,
            {
              width: panelWidth,
              top: insets.top + space.md,
              bottom: insets.bottom + space.md,
              right: insets.right + space.md,
            },
          ]}>
          <GlassSurface strong radius={28} style={styles.panel} contentStyle={styles.panelContent}>
            <Animated.View key={page} entering={enter} exiting={exit} style={styles.page}>
              {page === 'main' ? (
                <MainPage onClose={onClose} onAdmin={() => go('admin')} />
              ) : page === 'admin' ? (
                <AdminPage
                  onBack={() => go('main')}
                  onUnlocked={() => {
                    go('unlocked');
                    onAdminUnlocked?.();
                  }}
                />
              ) : (
                <UnlockedPage onClose={onClose} />
              )}
            </Animated.View>
          </GlassSurface>
        </Animated.View>
      ) : null}
    </View>
  );
}

function MainPage({ onClose, onAdmin }: { onClose: () => void; onAdmin: () => void }) {
  const { colors, preference, setPreference } = useVisualTheme();
  return (
    <>
      <Header title="Ajustes" trailing={<RoundButton icon="close" label="Cerrar" onPress={onClose} />} />

      <Section label="Apariencia">
        <SegmentedSwitch
          options={THEME_OPTIONS}
          value={preference}
          onChange={setPreference}
          segmentWidth={104}
          accessibilityLabel="Tema de la app"
        />
      </Section>

      <View style={styles.spacer} />

      <RowButton icon="lock-closed-outline" label="Admin" onPress={onAdmin} />
      <Text style={[type.caption, styles.footnote, { color: colors.inkMuted }]}>
        Acceso restringido al equipo de TI
      </Text>
    </>
  );
}

function AdminPage({ onBack, onUnlocked }: { onBack: () => void; onUnlocked: () => void }) {
  const { colors, scheme } = useVisualTheme();
  const [status, setStatus] = useState<CodeSlotsStatus>('idle');
  const [checking, setChecking] = useState(false);
  // El mensaje de error se mantiene hasta que se vuelve a escribir (el vaciado dura ~0.4 s).
  const [wrong, setWrong] = useState(false);
  const shake = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const onComplete = async (code: string) => {
    setChecking(true);
    const ok = await verifyAdminCode(code);
    setChecking(false);
    setStatus(ok ? 'success' : 'error');
    setWrong(!ok);
    if (ok) {
      setTimeout(onUnlocked, 900);
    } else {
      shake.set(
        withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 70 }),
          withTiming(-6, { duration: 60 }),
          withTiming(6, { duration: 60 }),
          withSpring(0, { damping: 12, stiffness: 300 }),
        ),
      );
    }
  };

  const message =
    wrong
      ? { text: 'Código incorrecto', color: colors.inkSecondary, tint: '#ff3b30' }
      : status === 'success'
        ? { text: 'Acceso concedido', color: colors.ink, tint: colors.accent }
        : checking
          ? { text: 'Verificando…', color: colors.inkSecondary, tint: colors.inkMuted }
          : { text: 'Ingresa el código de acceso', color: colors.inkSecondary, tint: colors.inkMuted };

  return (
    <>
      <Header
        title="Admin"
        leading={<RoundButton icon="chevron-back" label="Volver" onPress={onBack} />}
      />
      <View style={styles.codeBlock}>
        <Animated.View style={shakeStyle}>
          <CodeSlots
            length={ADMIN_CODE_LENGTH}
            status={status}
            mask
            autoFocus
            onChange={(code) => {
              setStatus('idle');
              if (code) setWrong(false);
            }}
            onComplete={onComplete}
            {...codeSlots[scheme]}
            slotSize={44}
            gap={8}
            radius={12}
            bounce={0.2}
            settle={0.3}
            rise={8}
            cascade={20}
            accessibilityLabel="Código de administrador"
          />
        </Animated.View>
        <Animated.Text
          key={message.text}
          entering={FadeIn.duration(200)}
          style={[type.caption, { color: wrong ? message.tint : message.color }]}>
          {message.text}
        </Animated.Text>
      </View>
    </>
  );
}

function UnlockedPage({ onClose }: { onClose: () => void }) {
  const { colors } = useVisualTheme();
  return (
    <>
      <Header title="Admin" trailing={<RoundButton icon="close" label="Cerrar" onPress={onClose} />} />
      <View style={styles.codeBlock}>
        <Ionicons name="shield-checkmark-outline" size={40} color={colors.ink} />
        <Text style={[type.heading, { color: colors.ink }]}>Modo administrador</Text>
        <Text style={[type.caption, styles.center, { color: colors.inkSecondary }]}>
          Aquí irán las opciones de administración (sala asignada a esta tablet, etc.).
        </Text>
      </View>
    </>
  );
}

function Header({
  title,
  leading,
  trailing,
}: {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  const { colors } = useVisualTheme();
  return (
    <View style={styles.header}>
      {leading}
      <Text style={[type.title, styles.headerTitle, { color: colors.ink }]}>{title}</Text>
      {trailing}
    </View>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  const { colors } = useVisualTheme();
  return (
    <View style={styles.section}>
      <Text style={[type.caption, styles.sectionLabel, { color: colors.inkMuted }]}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useVisualTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: colors.ink + (pressed ? '24' : '12') },
      ]}>
      <Ionicons name={icon} size={20} color={colors.ink} />
    </Pressable>
  );
}

function RowButton({
  icon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useVisualTheme();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => scale.set(withSpring(0.97, { damping: 16, stiffness: 320 }))}
        onPressOut={() => scale.set(withSpring(1, { damping: 16, stiffness: 320 }))}
        style={({ pressed }) => [
          styles.row,
          {
            borderColor: colors.ink + '26',
            backgroundColor: colors.ink + (pressed ? '14' : '08'),
          },
        ]}>
        <Ionicons name={icon} size={20} color={colors.ink} />
        <Text style={[type.heading, styles.rowLabel, { color: colors.ink }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.inkMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panelWrap: { position: 'absolute' },
  panel: { flex: 1 },
  panelContent: { flex: 1 },
  page: { flex: 1, padding: space.lg, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 44 },
  headerTitle: { flex: 1 },
  section: { gap: space.sm },
  sectionLabel: { letterSpacing: 1.2 },
  spacer: { flex: 1 },
  round: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { flex: 1 },
  footnote: { textAlign: 'center' },
  codeBlock: { alignItems: 'center', gap: space.md, paddingTop: space.lg },
  center: { textAlign: 'center' },
});
