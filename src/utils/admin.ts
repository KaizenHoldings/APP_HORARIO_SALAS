/**
 * Acceso de administrador de la tablet.
 *
 * Ojo: el código vive en el bundle de la app, así que solo evita cambios casuales en el
 * kiosco; no es seguridad real. Si hace falta, mover la verificación al backend
 * manteniendo esta misma firma asíncrona.
 */
const ADMIN_CODE = '976431';
export const ADMIN_CODE_LENGTH = ADMIN_CODE.length;

export async function verifyAdminCode(code: string): Promise<boolean> {
  // Pequeña espera para que la animación de "comprobando" se perciba.
  await new Promise((resolve) => setTimeout(resolve, 350));
  return code === ADMIN_CODE;
}
