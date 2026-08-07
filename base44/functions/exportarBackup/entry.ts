import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Exporta un respaldo completo de todos los datos del sistema en formato JSON.
// Solo accesible para super_admin / admin.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const entidades = [
      'Equipo', 'Actividad', 'Alerta', 'Parche', 'Kilometraje',
      'InspeccionPendiente', 'HistorialMantenimiento', 'Repuesto',
      'Proveedor', 'ConsumoRepuesto', 'OrdenDeCompra', 'SolicitudRepuesto',
      'SolicitudRepuestoSalud', 'OrdenTrabajo', 'Solicitud', 'SolicitudStock',
      'Comentario', 'Centro', 'AppConfig', 'ConfigAlerta',
      'InvitacionPendiente', 'AccesoNoAutorizado', 'Historial',
      'RepuestoCritico', 'EquipoDEA', 'User'
    ];

    const backup = {};
    for (const name of entidades) {
      try {
        const records = await base44.asServiceRole.entities[name].list();
        backup[name] = records;
      } catch (e) {
        backup[name] = { _error: String(e) };
      }
    }

    const payload = {
      metadata: {
        fecha: new Date().toISOString(),
        aplicacion: 'Sistema de Gestion - Corporacion Municipal Panguipulli',
        solicitado_por: user.email,
        total_entidades: entidades.length
      },
      data: backup
    };

    return Response.json(payload);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}