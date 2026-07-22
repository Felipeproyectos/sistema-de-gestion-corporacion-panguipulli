import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Solo super_admin y admin pueden aprobar o rechazar el acceso de un usuario.
const ROLES_APROBADORES = ['super_admin', 'admin'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ROLES_APROBADORES.includes(me.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { usuario_id, estado } = body;
    if (!usuario_id || !['aprobado', 'rechazado', 'pendiente'].includes(estado)) {
      return Response.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(usuario_id, { estado_acceso: estado });
    return Response.json({ ok: true, usuario_id, estado });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});