import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { differenceInDays, parseISO } from 'npm:date-fns@3.6.0';

// Automatización programada (1 vez al día, 03:00 CL).
// Genera alertas de vencimiento de parches y baterías de forma centralizada,
// con deduplicación server-side y bulkCreate. Reemplaza la generación
// client-side que disparaba writes por cada usuario que abría AlertasV2.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [equipos, parches, alertasActivas] = await Promise.all([
      base44.asServiceRole.entities.Equipo.list('-created_date', 1000),
      base44.asServiceRole.entities.Parche.list('-created_date', 2000),
      base44.asServiceRole.entities.Alerta.filter({ estado: 'activa' }, '-created_date', 1000),
    ]);

    const hoy = new Date();
    // Índice de alertas activas para deduplicación O(1)
    const existentes = new Set(
      alertasActivas.map(a => `${a.equipo_id}|${a.tipo}`)
    );

    const nuevas = [];
    const activos = equipos.filter(e => e.activo !== false);

    for (const eq of activos) {
      const parchesEq = parches.filter(p => p.equipo_id === eq.id && p.activo !== false);
      for (const parche of parchesEq) {
        if (!parche.fecha_vencimiento) continue;
        const dias = differenceInDays(parseISO(parche.fecha_vencimiento), hoy);
        const tipo = dias < 0 ? 'parche_vencido' : dias <= 90 ? 'parche_por_vencer' : null;
        if (!tipo) continue;
        const key = `${eq.id}|${tipo}`;
        if (existentes.has(key)) continue;
        existentes.add(key);
        nuevas.push({
          equipo_id: eq.id,
          tipo,
          nivel: dias < 0 ? 'critica' : 'advertencia',
          descripcion: `Parche ${parche.tipo} ${dias < 0 ? 'vencido' : `vence en ${dias} días`}`,
          estado: 'activa',
          centro: eq.centro_principal || '',
          subsede: eq.subsede || '',
        });
      }
      if (eq.fecha_vencimiento_bateria) {
        const dias = differenceInDays(parseISO(eq.fecha_vencimiento_bateria), hoy);
        const tipo = dias < 0 ? 'bateria_vencida' : dias <= 90 ? 'bateria_por_vencer' : null;
        if (tipo) {
          const key = `${eq.id}|${tipo}`;
          if (!existentes.has(key)) {
            existentes.add(key);
            nuevas.push({
              equipo_id: eq.id,
              tipo,
              nivel: dias < 0 ? 'critica' : 'advertencia',
              descripcion: `Batería ${dias < 0 ? 'vencida' : `vence en ${dias} días`}`,
              estado: 'activa',
              centro: eq.centro_principal || '',
              subsede: eq.subsede || '',
            });
          }
        }
      }
    }

    let creadas = 0;
    if (nuevas.length > 0) {
      const res = await base44.asServiceRole.entities.Alerta.bulkCreate(nuevas);
      creadas = Array.isArray(res) ? res.length : nuevas.length;
    }

    return Response.json({ ok: true, generadas: creadas, total_activas: alertasActivas.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});