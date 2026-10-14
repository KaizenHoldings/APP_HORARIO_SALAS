# Design System: Apple Glassmorphism + Impeccable Craft

<!-- impeccable:design-schema 1 -->

## Visual World

- **Aesthetic**: Apple Glassmorphism refinado, con acabados escarchados de alta gama, superficies translúcidas suspendidas y precisión tipográfica editorial.
- **Atmosphere**: Espacio corporativo moderno, sobrio, arquitectónico y ultra-nítido. No hay "AI slop" (cero gradientes multicolores baratos, sin tarjetas anidadas recursivas, sin etiquetas superfluas).
- **Materiality**: Placas de vidrio esmerilado con bordes de luz especular (`border: 1px solid rgba(255, 255, 255, 0.45)` en modo claro o `rgba(255, 255, 255, 0.12)` en modo oscuro), sombras suaves y amplias, y reflejos orgánicos de iluminación de fondo.

## Color Palette

### Base Surfaces & Glass
- **Canvas Light**: `#F0F4F8` a `#E2E8F0` con halo sutil ambiental
- **Glass Panel Light**: `rgba(255, 255, 255, 0.78)` con micro-borde `rgba(255, 255, 255, 0.9)`
- **Glass Panel Light Secondary**: `rgba(241, 245, 249, 0.75)`
- **Canvas Dark**: `#0A0D14` (profundo, con tinte medianoche)
- **Glass Panel Dark**: `rgba(20, 26, 38, 0.82)` con micro-borde `rgba(255, 255, 255, 0.12)`
- **Glass Panel Dark Secondary**: `rgba(30, 38, 54, 0.7)`

### State Signals (Apple Room Beacon)
- **Disponible (Available)**:
  - Dot & Accent: `#34C759` (Apple Emerald)
  - Glass Tint Light: `rgba(52, 199, 89, 0.12)` con borde `rgba(52, 199, 89, 0.35)`
  - Glass Tint Dark: `rgba(52, 199, 89, 0.22)` con borde `rgba(52, 199, 89, 0.45)`
  - Text: `#15803D` (Light) / `#4ADE80` (Dark)
- **En Reunión / Ocupada (Busy)**:
  - Dot & Accent: `#FF3B30` (Apple Crimson)
  - Glass Tint Light: `rgba(255, 59, 48, 0.10)` con borde `rgba(255, 59, 48, 0.32)`
  - Glass Tint Dark: `rgba(255, 59, 48, 0.20)` con borde `rgba(255, 59, 48, 0.40)`
  - Text: `#B91C1C` (Light) / `#F87171` (Dark)
- **Indicador Hora Actual (Live Now)**:
  - Accent: `#007AFF` / `#0A84FF`
  - Glow: Sutil pulsación de luz

### Typography & Ink
- **Display Ink Light**: `#0F172A` (Slate 900)
- **Secondary Ink Light**: `#475569` (Slate 600)
- **Muted Ink Light**: `#94A3B8` (Slate 400)
- **Display Ink Dark**: `#F8FAFC` (Slate 50)
- **Secondary Ink Dark**: `#94A3B8` (Slate 400)
- **Muted Ink Dark**: `#64748B` (Slate 500)

## Typography Standards
- Letra Display para títulos y números: `-0.03em` de tracking, pesos 700 / 800.
- Reloj y rangos de hora: números tabulares (`fontVariant: ['tabular-nums']`) para evitar que el ancho salte cada segundo.
- Jerarquía directa:
  1. Nombre de la Sala (Display Bold)
  2. Estado de la Sala (Pill Beacon prominente)
  3. Reloj en tiempo real (Tabular Mono/Sans grande)
  4. Bloques de agenda (Tarjetas táctiles con tiempo destacado)
  5. Detalles del organizador (limpio, con icono de monograma sutil)

## Responsive Tablet Architecture
- **Tablet Landscape (`width >= 768`)**:
  - Encabezado arquitectónico con separación de zonas: Identidad & Estado a la izquierda, Reloj y controles táctiles a la derecha.
  - Carrusel central con proyección estéreo (tarjetas previas y siguientes con escala sutil y rotación 3D leve).
  - Cronograma del día con lista de vidrio pulido, barras indicadoras de estado nítidas y badges de duración exactos.
- **Mobile / Portrait**:
  - Flujo vertical optimizado con tarjetas de toque ergonómicas (`minHeight: 48px`).

## Anti-Patterns Avoided (Impeccable Craft Floor)
- ❌ Prohibido anidar tarjetas dentro de tarjetas dentro de tarjetas ("cards inside cards").
- ❌ Prohibido usar texto con gradientes decorativos que perjudican el contraste.
- ❌ Prohibido usar bordes laterales gruesos sin propósito funcional.
- ❌ Prohibido usar sombras negras opacas de bloque duro.
- ❌ Prohibido mostrar navegaciones de plantilla sobrantes (como barras de pestañas "Expo Starter" en kioscos).
