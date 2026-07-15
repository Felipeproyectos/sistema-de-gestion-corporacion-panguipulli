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
    let permitidos;
    if (role === 'super_admin' || role === 'admin' || role === 'monitor_corporativo') {
      permitidos = activos;
    } else if (role === 'encargado_salud') {
      const cp = user.centro_principal;
      permitidos = cp ? activos.filter(e => e.centro_principal === cp) : [];
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