import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, user_agent } = await req.json();

    await base44.asServiceRole.entities.AccesoNoAutorizado.create({
      email: email || "desconocido",
      fecha_intento: new Date().toISOString(),
      user_agent: user_agent || "desconocido",
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});