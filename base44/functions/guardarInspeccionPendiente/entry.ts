import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json();

    if (!data.equipo_id || !data.fecha || !data.tipo_formulario) {
      return Response.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Buscar el equipo para obtener sus datos completos
    const equipo = await base44.asServiceRole.entities.Equipo.get(data.equipo_id);

    const registro = await base44.asServiceRole.entities.InspeccionPendiente.create({
      tipo_formulario: data.tipo_formulario,
      equipo_id: data.equipo_id,
      equipo_label: data.equipo_label || equipo?.marca + ' ' + equipo?.modelo || data.equipo_id,
      conductor: data.conductor || '',
      fecha: data.fecha,
      km_inicial: data.km_inicial || undefined,
      combustible: data.combustible || undefined,
      observaciones: data.observaciones || '',
      datos_json: JSON.stringify({
        equipo: equipo ? {
          marca: equipo.marca,
          modelo: equipo.modelo,
          tipo: equipo.tipo,
          patente: equipo.patente,
          centro_principal: equipo.centro_principal,
          subsede: equipo.subsede,
          numero_inventario: equipo.numero_inventario,
        } : null,
        conductor: data.conductor,
        fecha: data.fecha,
        hora_registro: new Date().toISOString(),
        km_inicial: data.km_inicial,
        combustible: data.combustible,
        luces: data.luces || null,
        motor: data.motor || null,
        accesorios: data.accesorios || null,
        documentos: data.documentos || null,
        danos: data.danos || null,
      }),
      estado: 'pendiente',
    });

    return Response.json({ ok: true, id: registro.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});