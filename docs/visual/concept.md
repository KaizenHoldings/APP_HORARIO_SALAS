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
