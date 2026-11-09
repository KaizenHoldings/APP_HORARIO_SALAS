import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CodeSlots, type CodeSlotsStatus } from '@/design/components/code-slots';
import { GlassSurface } from '@/design/components/glass-surface';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { codeSlots, space, type } from '@/design/tokens';
import { ADMIN_CODE_LENGTH, verifyAdminCode } from '@/utils/admin';

/** CodeSlots aislado, verificando contra el código de admin real. */
export function CodeSlotsPreview() {
  const { colors, scheme } = useVisualTheme();
  const [status, setStatus] = useState<CodeSlotsStatus>('idle');

  return (
    <GlassSurface strong radius={28} contentStyle={styles.card} style={styles.wrap}>
      <CodeSlots
        length={ADMIN_CODE_LENGTH}
        status={status}
        onChange={() => setStatus('idle')}
        onComplete={async (code) => setStatus((await verifyAdminCode(code)) ? 'success' : 'error')}
        {...codeSlots[scheme]}
      />
      <View style={styles.legend}>
        <Text style={[type.caption, { color: colors.inkSecondary }]}>estado: {status}</Text>
        <Text style={[type.caption, { color: colors.inkMuted }]}>
          Un código incorrecto muestra el vaciado en rojo; el correcto, el barrido con check.
        </Text>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  card: { padding: space.xl, gap: space.lg, alignItems: 'center' },
  legend: { alignItems: 'center', gap: space.xs },
});
