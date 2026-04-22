import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { inspeccion_id, accion, nota } = await req.json();
    if (!inspeccion_id || !accion) return Response.json({ error: 'Faltan parámetros' }, { status: 400 });

    const inspeccion = await base44.asServiceRole.entities.InspeccionPendiente.get(inspeccion_id);
    if (!inspeccion) return Response.json({ error: 'No encontrada' }, { status: 404 });

    if (accion === 'aprobar') {
      const datos = inspeccion.datos_json ? JSON.parse(inspeccion.datos_json) : {};

      // Crear actividad según tipo de formulario
      await base44.asServiceRole.entities.Actividad.create({
        equipo_id: inspeccion.equipo_id,
        tipo: inspeccion.tipo_formulario === 'turno_chofer' ? 'inspeccion_rutinaria' : inspeccion.tipo_formulario,
        fecha: inspeccion.fecha,
        usuario_nombre: inspeccion.conductor || '',
        observaciones: inspeccion.observaciones || '',
      });

      // Si tiene kilometraje, registrarlo
      if (inspeccion.km_inicial) {
        const kmInicial = Number(inspeccion.km_inicial);
        const kms = await base44.asServiceRole.entities.Kilometraje.filter({ equipo_id: inspeccion.equipo_id });
        const activo = kms.find(r => !r.km_final);
        if (activo) {
          await base44.asServiceRole.entities.Kilometraje.update(activo.id, { km_final: kmInicial });
        }
        await base44.asServiceRole.entities.Kilometraje.create({
          equipo_id: inspeccion.equipo_id,
          fecha: inspeccion.fecha,
          conductor: inspeccion.conductor || '',
          valor_km: kmInicial,
          km_inicial: kmInicial,
          observaciones: inspeccion.observaciones || '',
        });
      }

      // Marcar como aprobado
      await base44.asServiceRole.entities.InspeccionPendiente.update(inspeccion_id, {
        estado: 'aprobado',
        revisor_email: user.email,
        revisor_nombre: user.full_name,
        fecha_revision: new Date().toISOString().split('T')[0],
        nota_revision: nota || '',
      });

    } else if (accion === 'rechazar') {
      await base44.asServiceRole.entities.InspeccionPendiente.update(inspeccion_id, {
        estado: 'rechazado',
        revisor_email: user.email,
        revisor_nombre: user.full_name,
        fecha_revision: new Date().toISOString().split('T')[0],
        nota_revision: nota || '',
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});