# Nueva visual — espacio de trabajo

Rama de trabajo: `claude/nueva-visual` (la visual actual sigue intacta en `src/app/index.tsx`
y `src/components/feature-carousel.tsx`).

## Estructura

```
src/design/
  tokens/        colores, tipografía, espaciado/radios y motion de la nueva visual
  hooks/         use-visual-theme (paleta según esquema claro/oscuro)
  components/    componentes nuevos, uno por archivo
  catalog.tsx    registro de componentes para el laboratorio
src/app/lab/     laboratorio visual → ruta /lab (o /lab?c=<id>)
docs/visual/     conceptualización y decisiones
```

## Reglas

- La nueva capa **no importa** de `@/constants/theme` ni de componentes antiguos; solo de `@/design/*`.
  Así se puede reemplazar la visual actual al final sin arrastrar dependencias.
- Cada componente nuevo se registra en `src/design/catalog.tsx` con su `Preview` y un estado
  (`idea` → `en-progreso` → `listo`).
- La lógica de datos (API, storage, reloj) se reutiliza desde `src/utils` y `src/types`.
- Restricciones de DESIGN.md y PRODUCT.md siguen vigentes salvo que las cambiemos aquí:
  legibilidad a distancia, sin tarjetas anidadas, cifras tabulares, resiliencia sin red.

## Flujo por componente

1. Definir intención y variantes en `concept.md`.
2. Crear `src/design/components/<nombre>.tsx` usando solo tokens.
3. Registrarlo en el catálogo y revisarlo en `/lab` (claro/oscuro, tablet/móvil).
4. Cuando el conjunto esté completo, montarlo en una pantalla nueva y retirar la anterior.

## Ver el laboratorio

```bash
npx expo start --web   # abrir /lab
```
