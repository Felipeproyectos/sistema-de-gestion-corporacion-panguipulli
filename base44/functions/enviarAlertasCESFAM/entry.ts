import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const cesfamFiltro = body.cesfam || null;
    const emailsExtra = Array.isArray(body.emails_extra) ? body.emails_extra : [];

    const [parches, equipos, configAlertas] = await Promise.all([
      base44.asServiceRole.entities.Parche.list(),
      base44.asServiceRole.entities.EquipoDEA.list(),
      base44.asServiceRole.entities.ConfigAlerta.list(),
    ]);

    const hoy = new Date();

    // Agrupar parches críticos por equipo
    const alertasPorEquipo = {};
    for (const p of parches) {
      if (!p.fecha_vencimiento) continue;
      const dias = Math.ceil((new Date(p.fecha_vencimiento) - hoy) / (1000 * 60 * 60 * 24));
      if (dias > 30) continue;

      const equipo = equipos.find(e => e.id === p.equipo_id);
      if (!equipo) continue;

      if (!alertasPorEquipo[equipo.id]) {
        alertasPorEquipo[equipo.id] = { equipo, parches: [] };
      }
      alertasPorEquipo[equipo.id].parches.push({
        ...p,
        diasRestantes: dias,
        estado: dias < 0 ? 'VENCIDO' : dias <= 7 ? 'CRÍTICO' : 'PRÓXIMO'
      });
    }

    if (Object.keys(alertasPorEquipo).length === 0) {
      return Response.json({ message: 'No hay alertas que enviar', enviados: 0 });
    }

    // Filtrar por CESFAM si viene en el payload
    const equiposFiltrados = cesfamFiltro
      ? Object.values(alertasPorEquipo).filter(({ equipo }) =>
          equipo.establecimiento?.toLowerCase().includes(cesfamFiltro.toLowerCase()) ||
          cesfamFiltro.toLowerCase().includes(equipo.establecimiento?.toLowerCase() || '')
        )
      : Object.values(alertasPorEquipo);

    // Agrupar alertas por establecimiento (CESFAM)
    const alertasPorCesfam = {};
    for (const { equipo, parches: ps } of equiposFiltrados) {
      const est = equipo.establecimiento;
      if (!alertasPorCesfam[est]) alertasPorCesfam[est] = [];
      alertasPorCesfam[est].push({ equipo, parches: ps });
    }

    let enviados = 0;

    // Enviar a correos extra manuales si hay alertas
    if (emailsExtra.length > 0 && Object.keys(alertasPorCesfam).length > 0) {
      const allRows = Object.entries(alertasPorCesfam).flatMap(([, alertas]) =>
        alertas.flatMap(({ equipo, parches: ps }) =>
          ps.map(p => `
            <tr>
              <td style="padding:10px;border-bottom:1px solid #f1f5f9;">${equipo.establecimiento}</td>
              <td style="padding:10px;border-bottom:1px solid #f1f5f9;">${equipo.marca} ${equipo.modelo}</td>
              <td style="padding:10px;border-bottom:1px solid #f1f5f9;">${equipo.lugar_destinado || '—'}</td>
              <td style="padding:10px;border-bottom:1px solid #f1f5f9;">${p.tipo}</td>
              <td style="padding:10px;border-bottom:1px solid #f1f5f9;">${new Date(p.fecha_vencimiento).toLocaleDateString('es-ES')}</td>
              <td style="padding:10px;border-bottom:1px solid #f1f5f9;font-weight:bold;color:${p.estado === 'VENCIDO' ? '#dc2626' : p.estado === 'CRÍTICO' ? '#ea580c' : '#d97706'}">
                ${p.estado === 'VENCIDO' ? `Vencido hace ${Math.abs(p.diasRestantes)} días` : `${p.diasRestantes} días restantes`}
              </td>
            </tr>`
          )
        )
      ).join('');
      const totalExtra = Object.values(alertasPorCesfam).reduce((acc, a) => acc + a.reduce((s, x) => s + x.parches.length, 0), 0);
      const bodyExtra = `<div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:24px;background:#f8fafc;">
        <div style="background:#1565c0;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:22px;">⚠️ Alertas DEA — Resumen General</h1>
        </div>
        <div style="background:white;padding:24px;border-radius:0 0 12px 12px;">
          <p>Se detectaron <strong>${totalExtra} parche(s)</strong> que requieren atención:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead><tr style="background:#f1f5f9;">
              <th style="padding:10px;text-align:left;">CESFAM</th>
              <th style="padding:10px;text-align:left;">Equipo</th>
              <th style="padding:10px;text-align:left;">Ubicación</th>
              <th style="padding:10px;text-align:left;">Tipo</th>
              <th style="padding:10px;text-align:left;">Vencimiento</th>
              <th style="padding:10px;text-align:left;">Estado</th>
            </tr></thead>
            <tbody>${allRows}</tbody>
          </table>
        </div>
      </div>`;
      for (const email of emailsExtra) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `⚠️ Alertas DEA: ${totalExtra} parche(s) requieren atención`,
          body: bodyExtra,
        });
        enviados++;
      }
    }

    for (const [cesfam, alertas] of Object.entries(alertasPorCesfam)) {
      // Buscar config de emails para este CESFAM
      const config = configAlertas.find(c =>
        c.cesfam.toLowerCase().includes(cesfam.toLowerCase()) ||
        cesfam.toLowerCase().includes(c.cesfam.toLowerCase())
      );
      if (!config || !config.emails?.length) continue;

      const rows = alertas.flatMap(({ equipo, parches: ps }) =>
        ps.map(p => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #f1f5f9;">${equipo.marca} ${equipo.modelo}</td>
            <td style="padding:10px;border-bottom:1px solid #f1f5f9;">${equipo.lugar_destinado || '—'}</td>
            <td style="padding:10px;border-bottom:1px solid #f1f5f9;">${p.tipo}</td>
            <td style="padding:10px;border-bottom:1px solid #f1f5f9;">${new Date(p.fecha_vencimiento).toLocaleDateString('es-ES')}</td>
            <td style="padding:10px;border-bottom:1px solid #f1f5f9;font-weight:bold;color:${p.estado === 'VENCIDO' ? '#dc2626' : p.estado === 'CRÍTICO' ? '#ea580c' : '#d97706'}">
              ${p.estado === 'VENCIDO' ? `Vencido hace ${Math.abs(p.diasRestantes)} días` : `${p.diasRestantes} días restantes`}
            </td>
          </tr>
        `)
      ).join('');

      const totalAlertas = alertas.reduce((acc, a) => acc + a.parches.length, 0);
      const body = `
        <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:24px;background:#f8fafc;">
          <div style="background:#3b82f6;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:white;margin:0;font-size:22px;">⚠️ Alertas DEA — ${cesfam}</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0 0;font-size:14px;">${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style="background:white;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <p style="color:#334155;margin:0 0 20px 0;">Se detectaron <strong>${totalAlertas} parche(s)</strong> que requieren atención en <strong>${cesfam}</strong>:</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:10px;text-align:left;color:#475569;">Equipo</th>
                  <th style="padding:10px;text-align:left;color:#475569;">Ubicación</th>
                  <th style="padding:10px;text-align:left;color:#475569;">Tipo Parche</th>
                  <th style="padding:10px;text-align:left;color:#475569;">Vencimiento</th>
                  <th style="padding:10px;text-align:left;color:#475569;">Estado</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="margin:24px 0 0 0;font-size:12px;color:#94a3b8;text-align:center;">Sistema de Gestión de Equipos DEA — Corporación Municipal de Panguipulli</p>
          </div>
        </div>
      `;

      for (const email of config.emails) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          subject: `⚠️ Alertas DEA ${cesfam}: ${totalAlertas} parche(s) requieren atención`,
          body,
        });
        enviados++;
      }
    }

    return Response.json({ message: 'Alertas enviadas correctamente', enviados });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});