import { useEffect, useState } from 'react';

/**
 * Hora actual, actualizada justo al cambiar cada minuto.
 * `override` fija una hora (laboratorio, pruebas) y desactiva el reloj.
 */
export function useNow(override?: Date | null): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (override) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(new Date());
    const msToNextMinute = 60_000 - (Date.now() % 60_000) + 50;
    const timeout = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60_000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [override]);

  return override ?? now;
}
