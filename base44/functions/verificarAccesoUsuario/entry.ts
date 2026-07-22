import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Roles con acceso siempre permitido (no requieren aprobación explícita).
const ROLES_PRIVILEGIADOS = ['super_admin', 'admin'];

// Un usuario se considera "ya en operación" (legacy, previo a la aprobación
// obligatoria) si tiene un rol distinto de 'user' o si ya tiene área/centro
// asignado. A estos se les concede acceso automáticamente para no bloquear a
// personal existente al introducir el control de acceso.
function pareceUsuarioLegitimo(u) {
  if (!u) return false;
  if (u.role && u.role !== 'user') return true;
  if (u.area) return true;
  if (u.centro_principal || u.centro_asignado) return true;
  if (Array.isArray(u.centros_asignados) && u.centros_asignados.length > 0) return true;
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Aplicar invitación pendiente: si un Jefe/Admin invitó a este correo con un
    // rol específico (mecánico, etc.), se aplica ahora que el usuario ingresó.
    try {
      const correo = (me.email || '').toLowerCase();
      const invitaciones = await base44.asServiceRole.entities.InvitacionPendiente.filter({ email: correo, aplicada: false });
      const inv = invitaciones?.[0];
      if (inv) {
        const cambios: Record<string, unknown> = { estado_acceso: 'aprobado' };
        if (inv.rol_asignado) cambios.role = inv.rol_asignado;
        if (inv.centro_principal) cambios.centro_principal = inv.centro_principal;
        await base44.asServiceRole.entities.User.update(me.id, cambios).catch(() => {});
        await base44.asServiceRole.entities.InvitacionPendiente.update(inv.id, { aplicada: true }).catch(() => {});
        return Response.json({ acceso: true, estado: 'aprobado' });
      }
    } catch (_) { /* si falla la aplicación, se sigue con el flujo normal */ }

    // super_admin / admin siempre entran.
    if (ROLES_PRIVILEGIADOS.includes(me.role)) {
      return Response.json({ acceso: true, estado: 'aprobado' });
    }

    // Ya aprobado explícitamente.
    if (me.estado_acceso === 'aprobado') {
      return Response.json({ acceso: true, estado: 'aprobado' });
    }

    // Rechazado explícitamente: bloqueado.
    if (me.estado_acceso === 'rechazado') {
      return Response.json({ acceso: false, estado: 'rechazado' });
    }

    // Sin estado definido (usuario legacy previo al control de acceso): si ya
    // tenía rol/centro operativo, se marca como aprobado y se le deja entrar.
    if (!me.estado_acceso && pareceUsuarioLegitimo(me)) {
      await base44.asServiceRole.entities.User.update(me.id, { estado_acceso: 'aprobado' }).catch(() => {});
      return Response.json({ acceso: true, estado: 'aprobado' });
    }

    // Usuario recién auto-registrado (rol 'user', sin nada asignado): pendiente
    // de aprobación por un super_admin / admin.
    if (!me.estado_acceso) {
      await base44.asServiceRole.entities.User.update(me.id, { estado_acceso: 'pendiente' }).catch(() => {});
    }
    return Response.json({ acceso: false, estado: 'pendiente' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});