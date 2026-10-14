# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

1. **Visitantes y empleados de oficina**: Se acercan a la puerta de la sala de reuniones para verificar en menos de 2 segundos si la sala está libre u ocupada, quién la reservó y cuándo termina la reunión actual.
2. **Organizadores de reuniones**: Consultan la agenda del día y los próximos bloques disponibles directamente en la pantalla de la tablet en la entrada de la sala.
3. **Administradores de TI/Oficina**: Configuran qué sala corresponde a cada tablet mediante el menú discreto de ajustes de sala.

## Product Purpose

`salas-tablet` es un sistema de señalización digital y display interactivo para salas de conferencias, diseñado específicamente para tablets táctiles montadas en pared (como iPad, Samsung Galaxy Tab o pantallas táctiles industriales) y kioscos web. Proporciona visibilidad en tiempo real del estado de ocupación de las salas, cronograma del día y sincronización continua con el calendario corporativo.

## Positioning

Una interfaz de visualización de sala de reuniones con estética premium Apple Glassmorphism combinada con la rigurosidad y sobriedad de Impeccable: cero saturación innecesaria, legibilidad instantánea a 3 metros de distancia, tipografía con números tabulares y contraste de grado industrial.

## Operating Context

- **Dispositivo**: Tablets de 8" a 13" montadas en pared en orientación horizontal o vertical, conectadas a alimentación constante.
- **Ambiente**: Pasillos de oficinas corporativas con diversas condiciones de iluminación natural y artificial.
- **Interacción**: Vistas rápidas a distancia (scannability instantánea) y toques rápidos ocasionales para inspeccionar horarios o cambiar la sala configurada.

## Capabilities and Constraints

- Reloj del sistema en tiempo real sincronizado a nivel de segundo/minuto.
- Detección automática del bloque horario actual en función de la hora local.
- Conexión a API REST (`http://127.0.0.1:8000/salas` y `/salas/agenda`) con fallback resiliente a datos locales (`mock-agenda.ts`).
- Almacenamiento local persistente (`AsyncStorage`) para recordar la sala asignada a la tablet.
- Compatibilidad multiplataforma: React Native en Expo SDK 57 (iOS, Android y Web).

## Brand Commitments

- **Estética**: Apple Glassmorphism + Impeccable Kinpaku Craft.
- **Tonos**: Fondos translúcidos con desenfoque escarchado, bordes milimétricos de luz, tipografía limpia y estados verde esmeralda (disponible) y carmesí (ocupado).
- **Cero AI-Slop**: Sin anidación excesiva de tarjetas, sin degradados de texto genéricos, sin etiquetas redundantes.

## Product Principles

1. **Legibilidad a distancia**: El estado de la sala (DISPONIBLE / EN REUNIÓN) y el nombre de la sala deben ser legibles inmediatamente desde la puerta.
2. **Jerarquía sin ruido**: La información secundaria (organizador, próximos bloques) complementa sin competir con el estado actual.
3. **Tacto fluido y natural**: Animaciones sutiles tipo resorte (spring) de Apple para el carrusel y selección de bloques.
4. **Resiliencia total**: Si la red o el backend falla, la app muestra la información de respaldo sin trabarse ni mostrar errores invasivos.
