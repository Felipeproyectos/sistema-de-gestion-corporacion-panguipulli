import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json();

    if (!data.equipo_id || !data.fecha || !data.tipo_formulario) {
      return Response.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const registro = await base44.asServiceRole.entities.InspeccionPendiente.create({
      tipo_formulario: data.tipo_formulario,
      equipo_id: data.equipo_id,
      equipo_label: data.equipo_label || data.equipo_id,
      conductor: data.conductor || '',
      fecha: data.fecha,
      km_inicial: data.km_inicial || undefined,
      combustible: data.combustible || undefined,
      observaciones: data.observaciones || '',
      estado: 'pendiente',
    });

    return Response.json({ ok: true, id: registro.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});