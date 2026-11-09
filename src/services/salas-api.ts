import axios from 'axios';

import type { AgendaResponse, SalaInfo } from '@/types/agenda';

/**
 * Cliente del backend de salas.
 *
 * Configuración por variables de entorno (se incrustan en el build):
 * - EXPO_PUBLIC_API_URL  URL base del backend (p. ej. http://10.26.102.2:8000)
 * - EXPO_PUBLIC_API_KEY  clave que se envía en la cabecera `X-API-Key`
 */
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';

export const apiConfigured = API_BASE_URL.length > 0;

// eslint-disable-next-line import/no-named-as-default-member -- axios.create es la API documentada
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'X-API-Key': API_KEY },
});

/** Fecha local YYYY-MM-DD (no UTC: en Caracas, después de las 8 PM, UTC ya es mañana). */
export function localDateISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function describeError(err: unknown): string {
  const e = err as { response?: { data?: { detail?: string; message?: string } }; message?: string };
  return e?.response?.data?.detail || e?.response?.data?.message || e?.message || 'Error de red';
}

/** GET /salas → lista de salas del sistema. */
export async function fetchSalas(): Promise<SalaInfo[]> {
  if (!apiConfigured) throw new Error('EXPO_PUBLIC_API_URL no configurada');
  try {
    const { data } = await client.get('/salas');
    return Array.isArray(data?.salas) ? data.salas : [];
  } catch (err) {
    throw new Error(`No se pudieron cargar las salas: ${describeError(err)}`);
  }
}

/** GET /salas/agenda?email=&fecha= → agenda del día de una sala. */
export async function fetchAgenda(email: string, fecha = localDateISO()): Promise<AgendaResponse> {
  if (!apiConfigured) throw new Error('EXPO_PUBLIC_API_URL no configurada');
  try {
    const { data } = await client.get('/salas/agenda', { params: { email, fecha } });
    if (!data?.sala) throw new Error('Respuesta inválida del servidor');
    return data as AgendaResponse;
  } catch (err) {
    throw new Error(`No se pudo cargar la agenda de ${email}: ${describeError(err)}`);
  }
}
