import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // asServiceRole omite RLS; el scoping se aplica acá según auth.me(),
    // que entrega centro_principal plano (a diferencia de las plantillas RLS).
    const [allEquipos, allParches] = await Promise.all([
      base44.asServiceRole.entities.Equipo.list(),
      base44.asServiceRole.entities.Parche.list()
    ]);

    const activos = allEquipos.filter(e => e.activo !== false);

    const role = user.role;
    // Centros permitidos del usuario: unión de centro_principal y centros_asignados.
    const centrosPermitidos = Array.from(new Set([
      ...(user.centro_principal ? [user.centro_principal] : []),
      ...(Array.isArray(user.centros_asignados) ? user.centros_asignados : [])
    ].filter(Boolean)));

    let permitidos;
    if (role === 'super_admin' || role === 'admin' || role === 'monitor_corporativo') {
      permitidos = activos;
    } else if (role === 'encargado_salud' || role === 'encargado_compras_salud' || role === 'user') {
      // Roles de salud con alcance por centro: equipos de sus centros asignados
      // o explícitamente asignados a su email.
      permitidos = activos.filter(e =>
        centrosPermitidos.includes(e.centro_principal) ||
        (e.usuarios_asignados || []).includes(user.email)
      );
    } else if (role === 'jefe_taller' || role === 'mecanico' || role === 'encargado_compras_taller') {
      permitidos = activos.filter(e => e.tipo === 'ambulancia');
    } else {
      permitidos = activos.filter(e => (e.usuarios_asignados || []).includes(user.email));
    }

    const ids = new Set(permitidos.map(e => e.id));
    const parchesPermitidos = allParches.filter(p => ids.has(p.equipo_id) && p.activo !== false);

    return Response.json({ equipos: permitidos, parches: parchesPermitidos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});