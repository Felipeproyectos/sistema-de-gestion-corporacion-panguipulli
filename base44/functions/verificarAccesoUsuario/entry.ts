import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Roles con acceso siempre permitido (no requieren aprobación explícita).
const ROLES_PRIVILEGIADOS = ['super_admin', 'admin'];

// Número de intentos de acceso sin autorización antes de bloquear al usuario.
const UMBRAL_INTENTOS = 3;

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

// Registra cada evento de acceso (exitoso o fallido) para auditoría.
async function logAcceso(base44, me, resultado, userAgent, notas = '') {
  try {
    await base44.asServiceRole.entities.AccesoNoAutorizado.create({
      email: me.email || '',
      fecha_intento: new Date().toISOString(),
      user_agent: userAgent || '',
      resultado,
      usuario_nombre: me.full_name || '',
      rol: me.role || '',
      notas,
    });
  } catch { /* auditoría best-effort */ }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userAgent = req.headers.get('user-agent') || '';

    // super_admin / admin siempre entran.
    if (ROLES_PRIVILEGIADOS.includes(me.role)) {
      await logAcceso(base44, me, 'exitoso', userAgent);
      return Response.json({ acceso: true, estado: 'aprobado' });
    }

    // Rechazado explícitamente: bloqueado (tiene prioridad sobre cualquier
    // invitación pendiente). Registrar intento recurrente para auditoría.
    if (me.estado_acceso === 'rechazado') {
      await logAcceso(base44, me, 'rechazado', userAgent, 'Intento de acceso con cuenta rechazada');
      try {
        const correo = (me.email || '').toLowerCase();
        const invs = await base44.asServiceRole.entities.InvitacionPendiente.filter({ email: correo, aplicada: false });
        if (invs?.length) {
          await Promise.all(invs.map(inv => base44.asServiceRole.entities.InvitacionPendiente.update(inv.id, { aplicada: true }).catch(() => {})));
        }
      } catch (_) { /* best-effort */ }
      return Response.json({ acceso: false, estado: 'rechazado' });
    }

    // Ya aprobado explícitamente: reiniciar contador de intentos.
    if (me.estado_acceso === 'aprobado') {
      if (me.intentos_acceso) {
        await base44.asServiceRole.entities.User.update(me.id, { intentos_acceso: 0 }).catch(() => {});
      }
      await logAcceso(base44, me, 'exitoso', userAgent);
      return Response.json({ acceso: true, estado: 'aprobado' });
    }

    // Aplicar invitación pendiente: si un Jefe/Admin invitó a este correo con un
    // rol específico (mecánico, etc.), se aplica ahora que el usuario ingresó.
    try {
      const correo = (me.email || '').toLowerCase();
      const invitaciones = await base44.asServiceRole.entities.InvitacionPendiente.filter({ email: correo, aplicada: false });
      const inv = invitaciones?.[0];
      if (inv) {
        const cambios: Record<string, unknown> = { estado_acceso: 'aprobado', intentos_acceso: 0 };
        if (inv.rol_asignado) cambios.role = inv.rol_asignado;
        if (inv.centro_principal) cambios.centro_principal = inv.centro_principal;
        await base44.asServiceRole.entities.User.update(me.id, cambios).catch(() => {});
        await base44.asServiceRole.entities.InvitacionPendiente.update(inv.id, { aplicada: true }).catch(() => {});
        const meActualizado = { ...me, role: inv.rol_asignado || me.role };
        await logAcceso(base44, meActualizado, 'exitoso', userAgent, 'Acceso tras aplicar invitación pendiente');
        return Response.json({ acceso: true, estado: 'aprobado' });
      }
    } catch (_) { /* si falla la aplicación, se sigue con el flujo normal */ }

    // Sin estado definido (usuario legacy previo al control de acceso): si ya
    // tenía rol/centro operativo, se marca como aprobado y se le deja entrar.
    if (!me.estado_acceso && pareceUsuarioLegitimo(me)) {
      await base44.asServiceRole.entities.User.update(me.id, { estado_acceso: 'aprobado', intentos_acceso: 0 }).catch(() => {});
      await logAcceso(base44, me, 'exitoso', userAgent, 'Auto-aprobado (usuario legacy)');
      return Response.json({ acceso: true, estado: 'aprobado' });
    }

    // Usuario pendiente (o sin estado, no legítimo): contar el intento de acceso.
    // Tras superar el umbral, se bloquea automáticamente por seguridad.
    const intentos = (me.intentos_acceso || 0) + 1;
    if (intentos >= UMBRAL_INTENTOS) {
      await base44.asServiceRole.entities.User.update(me.id, {
        estado_acceso: 'rechazado',
        intentos_acceso: intentos
      }).catch(() => {});
      await logAcceso(base44, me, 'bloqueado', userAgent, `Bloqueado automáticamente tras ${intentos} intentos sin autorización`);
      return Response.json({ acceso: false, estado: 'rechazado', bloqueado_por_intentos: true });
    }

    await base44.asServiceRole.entities.User.update(me.id, {
      estado_acceso: 'pendiente',
      intentos_acceso: intentos
    }).catch(() => {});
    await logAcceso(base44, me, 'pendiente', userAgent, `Intento ${intentos} de acceso sin aprobación`);
    return Response.json({ acceso: false, estado: 'pendiente', intentos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});