import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

export default function InformePDF({ equipos, parches }) {
  const [generando, setGenerando] = useState(false);

  const generarPDF = async () => {
    setGenerando(true);

    const appConfig = await base44.entities.AppConfig.list().catch(() => []);
    const logo = appConfig[0]?.logo_url || null;
    const hoy = new Date();

    const parchesMap = {};
    parches.forEach(p => {
      if (!parchesMap[p.equipo_id]) parchesMap[p.equipo_id] = [];
      parchesMap[p.equipo_id].push(p);
    });

    const totalEquipos = equipos.length;
    const operativos = equipos.filter(e => e.estado === "operativo").length;
    const enMantenimiento = equipos.filter(e => e.estado === "mantenimiento").length;
    const fueraServicio = equipos.filter(e => e.estado === "fuera_de_servicio").length;

    const equiposHTML = equipos.map(eq => {
      const equipoParches = parchesMap[eq.id] || [];
      const estadoColor = eq.estado === "operativo" ? "#10b981" : eq.estado === "mantenimiento" ? "#f59e0b" : "#ef4444";
      const estadoLabel = eq.estado === "operativo" ? "Operativo" : eq.estado === "mantenimiento" ? "Mantenimiento" : "Fuera de Servicio";

      const parchesHTML = equipoParches.length > 0 ? `
        <div style="background:#f8fafc;border-radius:6px;padding:10px;margin-top:10px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#1a2e4a;text-transform:uppercase;letter-spacing:0.5px;">Inventario de Parches</p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
            ${equipoParches.map(p => {
              const dias = Math.ceil((new Date(p.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
              const vc = dias <= 0 ? "#ef4444" : dias <= 30 ? "#f59e0b" : "#10b981";
              return `<div style="background:white;border:1px solid #e2e8f0;border-radius:4px;padding:8px;">
                <p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;">${p.tipo}</p>
                <p style="margin:2px 0;font-size:14px;font-weight:700;color:#1a2e4a;">x${p.cantidad}</p>
                <p style="margin:0;font-size:9px;color:${vc};">Vence: ${format(new Date(p.fecha_vencimiento), "dd/MM/yy")}</p>
              </div>`;
            }).join('')}
          </div>
        </div>
      ` : `<p style="margin:8px 0 0;font-size:11px;color:#94a3b8;font-style:italic;">Sin parches registrados</p>`;

      const notasHTML = eq.notas ? `
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;">
          <p style="margin:0 0 2px;font-size:10px;color:#94a3b8;text-transform:uppercase;">Notas</p>
          <p style="margin:0;font-size:11px;color:#334155;line-height:1.5;">${eq.notas}</p>
        </div>
      ` : "";

      return `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:14px;page-break-inside:avoid;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
            <div>
              <h3 style="margin:0;font-size:15px;font-weight:700;color:#1a2e4a;">${eq.marca} ${eq.modelo}</h3>
              <p style="margin:3px 0 0;font-size:11px;color:#94a3b8;">S/N: ${eq.numero_serie}</p>
            </div>
            <span style="background:${estadoColor}20;color:${estadoColor};padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;">${estadoLabel}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:4px;">
            <div><p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Establecimiento</p><p style="margin:3px 0 0;font-size:12px;color:#334155;font-weight:600;">${eq.establecimiento}</p></div>
            <div><p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Lugar Destinado</p><p style="margin:3px 0 0;font-size:12px;color:#334155;font-weight:600;">${eq.lugar_destinado || "—"}</p></div>
            <div><p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Año Adquisición</p><p style="margin:3px 0 0;font-size:12px;color:#334155;font-weight:600;">${eq.anio_adquisicion || "—"}</p></div>
            <div><p style="margin:0;font-size:10px;color:#94a3b8;text-transform:uppercase;">Valor</p><p style="margin:3px 0 0;font-size:12px;color:#334155;font-weight:600;">${eq.valor ? "$" + Number(eq.valor).toLocaleString() : "—"}</p></div>
          </div>
          ${parchesHTML}
          ${notasHTML}
        </div>
      `;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Informe de Equipos DEA</title>
  <style>
    @page { size: letter; margin: 18mm 20mm 22mm 20mm; }
    @media print {
      body { margin: 0; background: white; }
      .no-print { display: none !important; }
      .page-footer { display: block; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f0f4f8;
      margin: 0;
      padding: 28px 32px;
      color: #1e293b;
    }
    .page { background: white; max-width: 216mm; margin: 0 auto; padding: 24px 28px 20px; }
    .header-top { display: flex; align-items: center; gap: 14px; padding-bottom: 14px; border-bottom: 3px solid #e63946; margin-bottom: 20px; }
    .header-logo { width: 68px; height: 68px; object-fit: contain; }
    .header-org { }
    .header-org p { margin: 0; font-size: 15px; font-weight: 700; color: #1a2e4a; }
    .header-org span { font-size: 12px; color: #64748b; }
    .header-doc { margin-bottom: 6px; }
    .header-doc h1 { margin: 0; font-size: 26px; font-weight: 800; color: #1a2e4a; }
    .header-doc p { margin: 4px 0 0; font-size: 12px; color: #64748b; }
    .resumen { background: #f8fafc; border-left: 4px solid #e63946; padding: 14px 16px; border-radius: 6px; margin-bottom: 20px; }
    .resumen h2 { margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #1a2e4a; }
    .resumen-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    .resumen-item p:first-child { margin: 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .resumen-item p:last-child { margin: 3px 0 0; font-size: 22px; font-weight: 800; }
    .section-title { font-size: 16px; font-weight: 700; color: #1a2e4a; margin: 0 0 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
    .print-btn {
      position: fixed; bottom: 24px; right: 24px;
      background: #2563eb; color: white; border: none; border-radius: 10px;
      padding: 12px 22px; font-size: 14px; font-weight: 600; cursor: pointer;
      box-shadow: 0 4px 14px rgba(37,99,235,0.4);
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header-top">
    ${logo ? `<img src="${logo}" class="header-logo" alt="Logo"/>` : ""}
    <div class="header-org">
      <p>Corporación Municipal de Panguipulli</p>
      <span>Área Salud</span>
    </div>
  </div>
  <div class="header-doc">
    <h1>Informe de Equipos DEA</h1>
    <p>Generado el ${format(hoy, "dd/MM/yyyy 'a las' HH:mm")}</p>
  </div>

  <div class="resumen">
    <h2>Resumen Ejecutivo</h2>
    <div class="resumen-grid">
      <div class="resumen-item"><p>Total de Equipos</p><p style="color:#1a2e4a;">${totalEquipos}</p></div>
      <div class="resumen-item"><p>Operativos</p><p style="color:#10b981;">${operativos}</p></div>
      <div class="resumen-item"><p>En Mantenimiento</p><p style="color:#f59e0b;">${enMantenimiento}</p></div>
      <div class="resumen-item"><p>Fuera de Servicio</p><p style="color:#ef4444;">${fueraServicio}</p></div>
    </div>
  </div>

  <h2 class="section-title">Detalle de Equipos</h2>
  ${equiposHTML}

  <footer>
    Corporación Municipal Panguipulli &nbsp;–&nbsp; Departamento Informática &nbsp;–&nbsp; Área Salud<br/>
    Informe generado automáticamente el ${format(hoy, "dd/MM/yyyy")} a las ${format(hoy, "HH:mm")} hrs
  </footer>
</div>

<button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setGenerando(false);
  };

  return (
    <button
      onClick={generarPDF}
      disabled={generando}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
      style={{ background: "#6366f1" }}
    >
      {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {generando ? "Generando..." : "Descargar Informe PDF"}
    </button>
  );
}