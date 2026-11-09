import { StyleSheet, Text, View } from 'react-native';

import { AppFrame } from '@/design/components/app-frame';
import { useVisualTheme } from '@/design/hooks/use-visual-theme';
import { space, type } from '@/design/tokens';

/** Navbar + menú de ajustes dentro del armazón real, con pantallas de relleno. */
export function NavbarPreview() {
  return <AppFrame renderView={(view) => <Placeholder view={view} />} />;
}

function Placeholder({ view }: { view: 'this' | 'others' }) {
  const { colors } = useVisualTheme();
  return (
    <View style={styles.root} pointerEvents="none">
      <Text style={[type.display, { color: colors.ink }]}>
        {view === 'this' ? 'Esta sala' : 'Otras salas'}
      </Text>
      <Text style={[type.body, { color: colors.inkSecondary }]}>
        Contenido de la pantalla (próximos componentes)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingBottom: 80 },
});
