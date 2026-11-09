# Conceptualización visual

> Documento vivo. Aquí se registra cada decisión a medida que avanzamos.

## Dirección

- **Glassmorphism + minimalismo.**
- **Cards de vidrio tipo iOS:** esquinas con brillo de vidrio (borde especular) y desenfoque.
- **Degradados** de fondo vivos pero sobrios.
- **Moderna y limpia:** pocas superficies, mucho aire, jerarquía clara.

### Referencias

1. Tarjeta oscura con luz azul que sube desde abajo (bordes de vidrio iluminados).
2. Panel de vidrio sobre un degradado azul → hielo, tipografía grande y ligera ("Clarity Engine").
3. Card de vidrio oscura con resplandor azul en el borde inferior y un dato grande centrado.
4. Variante de 1 con identidad de marca y luz más amplia.

Hilo común: **navy/negro → azul eléctrico → blanco hielo**, luz que emana de los bordes,
vidrio con bordes finos y brillantes, texto blanco nítido.

## Formato

- Principal: **tablet horizontal**. Debe adaptarse a vertical y rotar (`orientation: default`).
- Cada componente se diseña en **claro y oscuro**.

## Registro de decisiones

| Fecha      | Decisión | Motivo |
| ---------- | -------- | ------ |
| 2026-11-09 | Fondo: Grainient (React Bits) con `#120f17 #0a192a #12509a #1676f9 #aadffe`, angle 55, flow 0.8, silk 0.35, grain 0.08, speed 2.35, sin interacción | Define el ambiente azul de las referencias; la tablet es kiosco, no hace falta interacción |
| 2026-11-09 | Modo claro del fondo: misma rampa con `lightMode` (bases a blanco, tintes aclarados) | Mantener una sola fuente de color para ambos esquemas |
| 2026-11-09 | Grainient nativo con Skia (SkSL) y web con WebGL2 | El original usa WebGL del DOM, que no existe en Android/iOS |
| 2026-11-09 | Navbar flotante sin barra de fondo: isotipo · switch de vidrio centrado · botón de ajustes circular | Minimalismo; los laterales miden igual para centrar el switch en cualquier orientación |
| 2026-11-09 | Ajustes en panel de vidrio flotante desde la derecha, con páginas animadas (Ajustes → Admin → Modo admin) | Un solo lugar para tema y acceso admin, sin modales encima de modales |
| 2026-11-09 | Admin con CodeSlots de 6 dígitos enmascarado; error = vaciado rojo + vibración horizontal; éxito = barrido con check | Feedback claro sin texto largo |
| 2026-11-09 | "Esta sala": estado a la izquierda (nombre + estado de color + detalle), hora y foto a la derecha, línea de tiempo abajo | Jerarquía para leer el estado a distancia; la foto da identidad sin competir |
| 2026-11-09 | Tres estados: Disponible (verde), Por ocuparse (naranja, reunión en ≤ 15 min), Ocupada (rojo) | Avisar antes de que alguien entre a una sala que está por ocuparse |
| 2026-11-09 | Foto de sala con fundido y halo desenfocado hacia el fondo; empieza bajo el reloj | Integrarla al degradado y mantener legible la hora |
| 2026-11-09 | Margen lateral común (`useGutter`: 64 / 40 / 20 px) para navbar y contenido | Los componentes estaban pegados a los lados; todo alineado a la misma retícula |
| 2026-11-09 | Línea de tiempo estilo barras de progreso (referencia del usuario): píldoras separadas, pasado en degradado lavanda→azul, bloque actual llenándose en su color, futuro gris (libre) o rojo translúcido (reservado); fila superior con icono, "Agenda de hoy" y nº de reuniones | Más minimalista y coherente con el lenguaje de la referencia |
| 2026-11-09 | Laboratorio plegable (botón inferior izquierdo, `?lab=0`) | Ver la distribución real de la pantalla sin la barra del lab |
