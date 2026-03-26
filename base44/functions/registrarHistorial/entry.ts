import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { event, data, old_data } = body;
    if (!event) return Response.json({ ok: true, skipped: true });

    const entityName = event.entity_name;
    const eventType = event.type;

    // Mapeo de nombres legibles
    const NOMBRES = {
      EquipoDEA: "Equipo DEA",
      Parche: "Parche",
      SolicitudStock: "Solicitud de Stock",
      HistorialMantenimiento: "Mantenimiento",
      Centro: "Centro de Salud",
      ConfigAlerta: "Config. Alerta",
    };

    const ACCIONES = { create: "crear", update: "editar", delete: "eliminar" };
    const accion = ACCIONES[eventType] || eventType;
    const entidadLabel = NOMBRES[entityName] || entityName;

    // Generar descripción según entidad
    let descripcion = `${accion.charAt(0).toUpperCase() + accion.slice(1)} ${entidadLabel}`;
    if (data) {
      if (entityName === "EquipoDEA") {
        descripcion = `${accion === "crear" ? "Registró" : accion === "editar" ? "Editó" : "Eliminó"} equipo DEA: ${data.marca || ""} ${data.modelo || ""} (S/N: ${data.numero_serie || "—"}) en ${data.establecimiento || "—"}`;
      } else if (entityName === "Parche") {
        descripcion = `${accion === "crear" ? "Agregó" : accion === "editar" ? "Editó" : "Eliminó"} parche tipo ${data.tipo || "—"} para equipo ID ${data.equipo_id || "—"}`;
      } else if (entityName === "SolicitudStock") {
        descripcion = `${accion === "crear" ? "Creó" : accion === "editar" ? "Actualizó" : "Eliminó"} solicitud de ${data.tipo_solicitud || "—"} — Estado: ${data.estado || "—"}`;
      } else if (entityName === "HistorialMantenimiento") {
        descripcion = `${accion === "crear" ? "Registró" : accion === "editar" ? "Editó" : "Eliminó"} mantenimiento tipo ${data.tipo_mantenimiento || "—"} para equipo ID ${data.equipo_id || "—"}`;
      } else if (entityName === "Centro") {
        descripcion = `${accion === "crear" ? "Creó" : accion === "editar" ? "Editó" : "Eliminó"} centro: ${data.nombre || "—"}`;
      }
    }

    // Obtener usuario que hizo la acción
    let usuario_email = data?.created_by || old_data?.created_by || "sistema";
    let usuario_nombre = "";

    try {
      const users = await base44.asServiceRole.entities.User.list();
      const u = users.find(x => x.email === usuario_email);
      if (u) usuario_nombre = u.full_name || "";
    } catch (_) {}

    await base44.asServiceRole.entities.Historial.create({
      usuario_email,
      usuario_nombre,
      accion,
      entidad: entityName,
      entidad_id: event.entity_id || "",
      descripcion,
      datos_anteriores: old_data ? JSON.stringify(old_data) : "",
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});