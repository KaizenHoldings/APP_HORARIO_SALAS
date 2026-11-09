# Nueva visual — espacio de trabajo

Rama de trabajo: `claude/nueva-visual` (la visual actual sigue intacta en `src/app/index.tsx`
y `src/components/feature-carousel.tsx`).

## Estructura

```
src/design/
  tokens/        colores, tipografía, espaciado/radios, motion y fondo (background.ts)
  theme/         VisualThemeProvider: fuerza claro/oscuro (o sigue al sistema)
  hooks/         use-visual-theme (paleta según el esquema activo)
  components/    componentes de la nueva visual, uno por archivo o carpeta
    app-background.tsx   fondo base de todas las pantallas (+ objetivo del blur en Android)
    grainient/           degradado animado (web: WebGL2 · nativo: Skia)
    glass-surface.tsx    vidrio iOS: blur + velo + brillo + borde especular
    app-frame.tsx        armazón de pantalla: Navbar + contenido + menú de ajustes
    navbar.tsx           isotipo · switch Esta sala / Otras salas · botón de ajustes
    settings-drawer.tsx  menú lateral: tema claro/oscuro/sistema y acceso Admin
    code-slots.tsx       entrada de código (React Bits portado a Reanimated)
    segmented-switch.tsx, glass-icon-button.tsx, brand-mark.tsx
  lab/           solo para el laboratorio: catálogo y vistas de configuración
src/app/lab/     laboratorio visual → ruta /lab
docs/visual/     conceptualización y decisiones
```

## Reglas

- La nueva capa **no importa** de `@/constants/theme` ni de componentes antiguos; solo de `@/design/*`.
- Cada componente se revisa en `/lab`, **siempre sobre `AppBackground`**, en claro y oscuro,
  horizontal (principal) y vertical.
- Cada componente nuevo se registra en `src/design/lab/catalog.tsx` con su `Preview` y un estado
  (`idea` → `en-progreso` → `listo`).
- La lógica de datos (API, storage, reloj) se reutiliza desde `src/utils` y `src/types`.

## Laboratorio

```bash
npx expo start --web
```

- `/lab` — abre el catálogo
- `/lab?c=navbar&scheme=dark` — abre un componente con el esquema inicial (`light` | `dark`)
- En tablet: `salastablet://lab` (deep link) con una build de desarrollo.

## Notas de plataforma

- **Grainient** usa dos implementaciones con el mismo shader:
  `grainient.web.tsx` (WebGL2, original de React Bits) y `grainient.tsx` (SkSL con
  `@shopify/react-native-skia`). Si se toca el shader, hay que cambiar ambos.
- En nativo el shader se calcula a media resolución (`resolution` = 0.5) para no cargar la GPU.
- **CodeSlots** (React Bits) usaba `motion/react`, Hugeicons y DOM; se reescribió con Reanimated
  manteniendo props y animaciones. La entrada es un TextInput invisible con teclado numérico.
- **Vidrio en Android:** `expo-blur` con `blurMethod="dimezisBlurViewSdk31Plus"` desenfoca el
  `BlurTargetView` de `AppBackground` (Android 12+; en versiones anteriores se ve el velo sin blur).
- **Código admin:** `src/utils/admin.ts`. Vive en el bundle: frena cambios casuales en el kiosco,
  no es seguridad real. Para endurecerlo, verificar en el backend con la misma firma.
- Shared values: usar `.set()` / `.get()` fuera de worklets (lo exige el lint del React Compiler).
- Skia y expo-blur son módulos nativos: la APK hay que volver a generarla (`eas build`) para que lo incluya.
- `app.json` → `orientation: "default"` (antes `portrait`) para permitir rotar la tablet.
