# Despliegue (producción)

La app ya usa la nueva visual como pantalla principal (`src/app/index.tsx`).
Solo falta cargar la **API key** del backend en EAS antes de compilar.

## Variables de entorno

| Variable | Dónde | Valor |
| -------- | ----- | ----- |
| `EXPO_PUBLIC_API_URL` | `eas.json` → `build.production.env` | `http://10.26.102.2:8000` (cambiar si el backend de producción es otro) |
| `EXPO_PUBLIC_API_KEY` | Variables de entorno de EAS, entorno **production** | la clave del backend (cabecera `X-API-Key`) |

Cargar la clave (una sola vez, desde la raíz del proyecto):

```bash
npx eas-cli@latest env:set production --name EXPO_PUBLIC_API_KEY --value "<la-clave>" --visibility sensitive
```

El perfil `production` declara `"environment": "production"`, así el build toma esa variable.

> Las variables `EXPO_PUBLIC_*` quedan incluidas dentro de la app compilada: cualquiera con la
> APK podría extraerlas. Sirven para identificar la app ante el backend, no como secreto.
> Si la clave debe ser secreta, el backend debería validar de otra forma (red interna, mTLS, etc.).

## Compilar

```bash
npx eas-cli@latest build --platform android --profile production
```

- El perfil `production` genera un **AAB** (formato de Google Play). Para instalar a mano o por MDM
  en las tablets, usar el perfil `preview` (APK) o añadir `"android": { "buildType": "apk" }` a `production`.
- La conexión es HTTP a `10.26.102.2`: está permitida por `plugins/withCleartextTraffic.js`.
  Si cambia la IP del backend, actualizarla también en ese plugin.

## Primer arranque en cada tablet

1. Tuerca → **Admin** → código de administrador (`src/utils/admin.ts`).
2. **Pantalla**: elegir la sala que muestra esta tablet (por defecto, la primera del sistema).
3. **Salas**: foto, equipamiento y capacidad de cada sala (se guardan en la tablet).
4. **Marca** y **Colores** si aplica.

Todo se guarda en el equipo (AsyncStorage). La agenda se refresca cada minuto; sin conexión se
muestra la última agenda del día con un aviso. Sin actividad, a los 30 s vuelve a "Esta sala".
