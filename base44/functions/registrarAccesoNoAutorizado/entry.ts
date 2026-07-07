import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Refuerzo de seguridad:
// 1) Registra el intento (igual que antes).
// 2) Detecta si el mismo correo ya intentó varias veces en las últimas 24h
//    y lo deja anotado en el registro.
// 3) Avisa por correo a todos los Base del Sistema (super_admin) en el momento,
//    igual que se hace con los incidentes de ambulancia — para que nadie tenga
//    que revisar la lista manualmente para enterarse.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, user_agent } = await req.json();
    const correo = email || 'desconocido';

    const ahora = new Date();
    const desde = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

    let intentosRecientes = 0;
    try {
      const previos = await base44.asServiceRole.entities.AccesoNoAutorizado.filter({ email: correo });
      intentosRecientes = previos.filter((p) => p.fecha_intento && new Date(p.fecha_intento) >= desde).length;
    } catch (_) { /* si falla el conteo, no bloquea el registro */ }

    const notas = intentosRecientes >= 2
      ? `Repetido: ${intentosRecientes + 1} intento(s) de este correo en las últimas 24h.`
      : '';

    await base44.asServiceRole.entities.AccesoNoAutorizado.create({
      email: correo,
      fecha_intento: ahora.toISOString(),
      user_agent: user_agent || 'desconocido',
      notas,
    });

    // Avisar a Base del Sistema (super_admin) por correo.
    try {
      const usuarios = await base44.asServiceRole.entities.User.list();
      const destinatarios = usuarios.filter((u) => u.role === 'super_admin' && u.email).map((u) => u.email);
      if (destinatarios.length > 0) {
        const asunto = intentosRecientes >= 2
          ? `🔒 Acceso no autorizado repetido: ${correo}`
          : `🔒 Intento de acceso no autorizado: ${correo}`;
        const cuerpo = `
          <h2 style="color:#dc2626">Intento de acceso no autorizado</h2>
          <p>Alguien intentó entrar al sistema con un correo que no está registrado ni invitado.</p>
          <table style="border-collapse:collapse;width:100%;font-size:13px">
            <tr><td style="padding:8px;font-weight:bold;color:#64748b">Correo</td><td style="padding:8px">${correo}</td></tr>
            <tr style="background:#f8fafc"><td style="padding:8px;font-weight:bold;color:#64748b">Fecha</td><td style="padding:8px">${ahora.toLocaleString('es-CL')}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#64748b">Navegador/dispositivo</td><td style="padding:8px">${user_agent || 'desconocido'}</td></tr>
            ${notas ? `<tr style="background:#fef2f2"><td style="padding:8px;font-weight:bold;color:#dc2626">Alerta</td><td style="padding:8px;color:#dc2626;font-weight:bold">${notas}</td></tr>` : ''}
          </table>
          <p style="margin-top:16px;color:#64748b;font-size:12px">
            Revisa el detalle en Accesos No Autorizados dentro del sistema.
          </p>
        `.trim();
        for (const destino of destinatarios) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: destino,
            subject: asunto,
            body: cuerpo,
          }).catch(() => {});
        }
      }
    } catch (_) { /* el aviso por correo nunca debe bloquear el registro del intento */ }

    return Response.json({ ok: true, intentosRecientes: intentosRecientes + 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
