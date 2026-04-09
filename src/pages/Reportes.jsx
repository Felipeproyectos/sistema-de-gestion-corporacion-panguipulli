import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Loader2, Filter } from "lucide-react";
import { CENTROS_ESTRUCTURA, TIPOS_EQUIPO, ESTADOS_EQUIPO } from "@/lib/centros";
import { differenceInDays, parseISO, format } from "date-fns";

export default function Reportes() {
  const [equipos, setEquipos] = useState([]);
  const [parches, setParches] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  const [filtroCentro, setFiltroCentro] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.Equipo.list(),
      base44.entities.Parche.list(),
      base44.entities.Actividad.list(),
      base44.entities.Solicitud.list()
    ]).then(([eq, pa, ac, so]) => {
      setEquipos(eq);
      setParches(pa);
      setActividades(ac);
      setSolicitudes(so);
      setLoading(false);
    });
  }, []);

  const generarPDF = () => {
    setGenerando(true);
    const hoy = new Date();

    let equiposFiltrados = [...equipos];
    if (filtroCentro) equiposFiltrados = equiposFiltrados.filter(e => e.centro_principal === filtroCentro);
    if (filtroTipo) equiposFiltrados = equiposFiltrados.filter(e => e.tipo === filtroTipo);

    const TIPO_INC_LABEL = { falla_mecanica: "Falla Mecánica", accidente: "Accidente", otros: "Otros" };
    const TIPO_LABELS = { dea: "DEA", monitor_desfibrilador: "Monitor Desfibrilador", ambulancia: "Ambulancia", monitor_multiparametros: "Monitor Multiparámetros" };
    const ESTADO_STYLES = {
      operativo: { bg: "#dcfce7", color: "#16a34a", label: "OPERATIVO" },
      mantenimiento: { bg: "#fef9c3", color: "#ca8a04", label: "MANTENCIÓN" },
      fuera_de_servicio: { bg: "#fee2e2", color: "#dc2626", label: "FUERA SERVICIO" }
    };

    const semaforo = (estado) => {
      const s = {
        ok: { dot: "#16a34a", label: "OK" },
        en_gestion: { dot: "#2563eb", label: "En Gestión" },
        pendiente: { dot: "#d97706", label: "Pendiente" },
        vencida: { dot: "#dc2626", label: "Vencida" },
        vencido: { dot: "#dc2626", label: "Vencido" },
        falla_leve: { dot: "#d97706", label: "Falla Leve" },
        falla_grave: { dot: "#dc2626", label: "Falla Grave" },
        desgastado: { dot: "#d97706", label: "Desgastado" },
        requiere_cambio: { dot: "#dc2626", label: "Req. Cambio" },
        baja_carga: { dot: "#d97706", label: "Baja Carga" },
        requiere_reemplazo: { dot: "#dc2626", label: "Reemplazo" }
      }[estado];
      if (!s) return `<span style="color:#94a3b8">—</span>`;
      return `<span style="display:inline-flex;align-items:center;gap:3px"><span style="width:7px;height:7px;border-radius:50%;background:${s.dot};display:inline-block;flex-shrink:0"></span><span style="color:${s.dot};font-weight:600">${s.label}</span></span>`;
    };

    const tarjetasEquipos = equiposFiltrados.map(eq => {
      const actEq = actividades.filter(a => a.equipo_id === eq.id);
      const ultInsp = actEq
        .filter(a => ["inspeccion","inspeccion_semanal","inspeccion_anual"].includes(a.tipo))
        .sort((a,b) => new Date(b.fecha)-new Date(a.fecha))[0];
      const incEq = actEq.filter(a => a.tipo === "incidente").sort((a,b) => new Date(b.fecha)-new Date(a.fecha));
      const est = ESTADO_STYLES[eq.estado] || { bg: "#f1f5f9", color: "#64748b", label: eq.estado };
      const esAmb = eq.tipo === "ambulancia";
      const tipoLabel = TIPO_LABELS[eq.tipo] || eq.tipo;

      const fotoHtml = eq.foto_url
        ? `<img src="${eq.foto_url}" style="width:100%;height:130px;object-fit:cover;border-radius:7px;border:1px solid #e2e8f0" />`
        : `<div style="width:100%;height:130px;background:linear-gradient(135deg,#eff6ff,#e0e7ff);border-radius:7px;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-direction:column">
            <div style="font-size:34px;margin-bottom:4px">${esAmb ? "🚑" : "🔬"}</div>
            <div style="color:#94a3b8;font-size:9px">Sin imagen registrada</div>
           </div>`;

      let detallesEspecificos = "";
      if (esAmb) {
        detallesEspecificos = `
          <div style="margin-top:8px;background:#f8fafc;border-radius:7px;padding:7px;border:1px solid #e2e8f0">
            <div style="font-size:8.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px">Estado Vehículo</div>
            <table style="width:100%;font-size:9px;border-collapse:collapse">
              <tr>
                <td style="padding:2px 3px;color:#64748b">Neumáticos:</td>
                <td style="padding:2px 3px">${semaforo(eq.estado_neumaticos)}</td>
                <td style="padding:2px 3px;color:#64748b">Luces:</td>
                <td style="padding:2px 3px">${semaforo(eq.estado_luces)}</td>
              </tr>
              <tr>
                <td style="padding:2px 3px;color:#64748b">Batería Veh.:</td>
                <td style="padding:2px 3px">${semaforo(eq.estado_bateria_vehiculo)}</td>
                <td style="padding:2px 3px;color:#64748b">Sirena:</td>
                <td style="padding:2px 3px">${semaforo(eq.estado_sirena)}</td>
              </tr>
              <tr>
                <td style="padding:2px 3px;color:#64748b">Rev. Técnica:</td>
                <td style="padding:2px 3px">${semaforo(eq.estado_revision_tecnica)}</td>
                <td style="padding:2px 3px;color:#64748b">Permiso Circ.:</td>
                <td style="padding:2px 3px">${semaforo(eq.estado_permiso_circulacion)}</td>
              </tr>
              ${eq.patente ? `<tr><td style="padding:2px 3px;color:#64748b">Patente:</td><td colspan="3" style="padding:2px 3px;font-weight:700;color:#1d4ed8">${eq.patente}</td></tr>` : ""}
              ${eq.conductor_responsable ? `<tr><td style="padding:2px 3px;color:#64748b">Conductor:</td><td colspan="3" style="padding:2px 3px;font-weight:600">${eq.conductor_responsable}</td></tr>` : ""}
            </table>
          </div>`;
      } else {
        const parchesEq = parches.filter(p => p.equipo_id === eq.id && p.activo);
        const parchesVencidos = parchesEq.filter(p => differenceInDays(parseISO(p.fecha_vencimiento), hoy) < 0);
        const parchesPorVencer = parchesEq.filter(p => { const d = differenceInDays(parseISO(p.fecha_vencimiento), hoy); return d >= 0 && d <= 90; });
        const batDias = eq.fecha_vencimiento_bateria ? differenceInDays(parseISO(eq.fecha_vencimiento_bateria), hoy) : null;
        detallesEspecificos = `
          <div style="margin-top:8px;background:#f8fafc;border-radius:7px;padding:7px;border:1px solid #e2e8f0">
            <div style="font-size:8.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px">Accesorios</div>
            <table style="width:100%;font-size:9px;border-collapse:collapse">
              ${batDias !== null ? `<tr><td style="padding:2px 3px;color:#64748b">Batería vence:</td><td style="padding:2px 3px;font-weight:600;color:${batDias < 0 ? "#dc2626" : batDias <= 90 ? "#d97706" : "#16a34a"}">${format(parseISO(eq.fecha_vencimiento_bateria),"dd/MM/yyyy")}${batDias < 0 ? " (VENCIDA)" : batDias <= 90 ? ` (${batDias}d)` : ""}</td></tr>` : ""}
              <tr><td style="padding:2px 3px;color:#64748b">Parches total:</td><td style="padding:2px 3px;font-weight:600">${parchesEq.length} registrado(s)</td></tr>
              ${parchesVencidos.length > 0 ? `<tr><td style="padding:2px 3px;color:#64748b">Vencidos:</td><td style="padding:2px 3px;font-weight:600;color:#dc2626">${parchesVencidos.length} vencido(s)</td></tr>` : ""}
              ${parchesPorVencer.length > 0 ? `<tr><td style="padding:2px 3px;color:#64748b">Por vencer:</td><td style="padding:2px 3px;font-weight:600;color:#d97706">${parchesPorVencer.length} por vencer (≤90d)</td></tr>` : ""}
            </table>
          </div>`;
      }

      const incidentesHtml = incEq.length > 0
        ? `<div style="background:#fef2f2;border-radius:6px;padding:6px 8px;margin-top:6px;border-left:3px solid #dc2626">
            <div style="font-size:8.5px;font-weight:700;color:#dc2626;margin-bottom:2px">⚠ Último Incidente</div>
            <div style="font-size:8.5px;color:#64748b">${incEq[0].fecha} · ${TIPO_INC_LABEL[incEq[0].tipo_incidente] || "Sin clasificar"}${incEq[0].usuario_nombre ? " · " + incEq[0].usuario_nombre : ""}</div>
            ${incEq[0].observaciones ? `<div style="font-size:8.5px;color:#374151;margin-top:2px;font-style:italic">"${incEq[0].observaciones.substring(0,80)}${incEq[0].observaciones.length>80?"...":""}"</div>` : ""}
           </div>`
        : "";

      const inspTipoLabel = ultInsp?.tipo === "inspeccion_semanal" ? "Semanal" : ultInsp?.tipo === "inspeccion_anual" ? "Anual" : "Inspección";
      const inspHtml = ultInsp
        ? `<div style="background:#eff6ff;border-radius:6px;padding:6px 8px;margin-top:6px;border-left:3px solid #2563eb">
            <div style="font-size:8.5px;font-weight:700;color:#2563eb;margin-bottom:2px">✓ Última Inspección</div>
            <div style="font-size:8.5px;color:#64748b">${ultInsp.fecha} · ${inspTipoLabel}${ultInsp.usuario_nombre ? " · " + ultInsp.usuario_nombre : ""}</div>
            ${ultInsp.observaciones ? `<div style="font-size:8.5px;color:#374151;margin-top:2px;font-style:italic">"${ultInsp.observaciones.substring(0,60)}${ultInsp.observaciones.length>60?"...":""}"</div>` : ""}
           </div>`
        : `<div style="background:#f8fafc;border-radius:6px;padding:5px 8px;margin-top:6px;border-left:3px solid #e2e8f0">
            <div style="font-size:8.5px;color:#94a3b8">Sin inspecciones registradas</div>
           </div>`;

      return `
        <div style="background:white;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;break-inside:avoid;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin-bottom:2px">
          <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:9px 12px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:9px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.05em">${tipoLabel}</div>
              <div style="font-size:13px;font-weight:700;color:white">${eq.marca} ${eq.modelo}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:8.5px;color:rgba(255,255,255,0.6)">N° Inventario</div>
              <div style="font-size:12px;font-weight:700;color:white">${eq.numero_inventario || "—"}</div>
            </div>
          </div>
          <div style="padding:10px;display:grid;grid-template-columns:120px 1fr;gap:10px">
            <div>
              ${fotoHtml}
              <div style="margin-top:6px;text-align:center;padding:4px 6px;border-radius:6px;background:${est.bg};color:${est.color};font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em">${est.label}</div>
              <div style="margin-top:4px;font-size:8px;color:#64748b;text-align:center;line-height:1.4">${eq.centro_principal}${eq.subsede ? `<br/>${eq.subsede}` : ""}</div>
            </div>
            <div>
              <table style="width:100%;font-size:9px;border-collapse:collapse">
                ${eq.numero_serie ? `<tr><td style="padding:2px 0;color:#94a3b8;width:40%">N° Serie</td><td style="padding:2px 0;font-weight:600">${eq.numero_serie}</td></tr>` : ""}
                ${eq.anio_adquisicion ? `<tr><td style="padding:2px 0;color:#94a3b8">Año Adq.</td><td style="padding:2px 0;font-weight:600">${eq.anio_adquisicion}</td></tr>` : ""}
                ${eq.ubicacion_especifica ? `<tr><td style="padding:2px 0;color:#94a3b8">Ubicación</td><td style="padding:2px 0;font-weight:600">${eq.ubicacion_especifica}</td></tr>` : ""}
              </table>
              ${detallesEspecificos}
              ${inspHtml}
              ${incidentesHtml}
            </div>
          </div>
        </div>`;
    }).join("");

    const incFiltrados = actividades
      .filter(a => a.tipo === "incidente" && equiposFiltrados.some(e => e.id === a.equipo_id))
      .sort((a,b) => new Date(b.fecha)-new Date(a.fecha));

    const filasIncidentes = incFiltrados.map(inc => {
      const eq = equipos.find(e => e.id === inc.equipo_id);
      const esAmb = eq?.tipo === "ambulancia";
      const opHtml = esAmb
        ? (inc.ambulancia_operativa === false
          ? '<span style="background:#fee2e2;color:#dc2626;padding:1px 5px;border-radius:4px;font-weight:700;font-size:8px">FUERA SERVICIO</span>'
          : '<span style="background:#dcfce7;color:#16a34a;padding:1px 5px;border-radius:4px;font-weight:700;font-size:8px">OPERATIVA</span>')
        : '<span style="color:#94a3b8">—</span>';
      return `<tr>
        <td style="white-space:nowrap">${inc.fecha||""}</td>
        <td>${eq?.numero_inventario||""}</td>
        <td>${TIPO_LABELS[eq?.tipo]||eq?.tipo||""}</td>
        <td>${eq?.centro_principal||""}${eq?.subsede?" / "+eq.subsede:""}</td>
        <td><span style="background:#fee2e2;color:#dc2626;padding:1px 5px;border-radius:4px;font-size:8px;font-weight:700">${TIPO_INC_LABEL[inc.tipo_incidente]||"Sin clasificar"}</span></td>
        <td>${inc.observaciones||"—"}</td>
        <td>${opHtml}</td>
        <td>${inc.usuario_nombre||"—"}</td>
      </tr>`;
    }).join("");

    const totalOp = equiposFiltrados.filter(e=>e.estado==="operativo").length;
    const totalMant = equiposFiltrados.filter(e=>e.estado==="mantenimiento").length;
    const totalFS = equiposFiltrados.filter(e=>e.estado==="fuera_de_servicio").length;

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Reporte Equipos – Corporación Municipal de Panguipulli</title>
<style>
  @page { size: A4; margin: 12mm 10mm 20mm 10mm; }
  @media print { .no-print { display:none!important; } body { background:white!important; padding:0!important; } }
  * { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#f1f5f9; margin:0; padding:16px; color:#1e293b; }
  .page { background:white; max-width:190mm; margin:0 auto; padding:16px; }
  .header-bar { background:linear-gradient(135deg,#0f2d6b 0%,#1565c0 60%,#0288d1 100%); border-radius:12px; padding:14px 20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
  .header-bar h1 { color:white; margin:0; font-size:16px; font-weight:800; letter-spacing:-0.02em; }
  .header-bar p { color:rgba(255,255,255,0.7); margin:3px 0 0; font-size:9.5px; }
  .header-right { text-align:right; color:rgba(255,255,255,0.8); font-size:9px; line-height:1.6; }
  .summary-bar { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin-bottom:12px; }
  .sum-card { border-radius:8px; padding:7px 10px; text-align:center; border:1px solid #e2e8f0; }
  .sum-card .n { font-size:19px; font-weight:800; }
  .sum-card .l { font-size:8px; color:#64748b; text-transform:uppercase; font-weight:600; margin-top:1px; }
  .equipo-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:9px; }
  .section-title { font-size:11.5px; font-weight:700; color:#1e3a5f; margin:12px 0 7px; display:flex; align-items:center; gap:5px; border-bottom:2px solid #e2e8f0; padding-bottom:5px; }
  .inc-table { width:100%; border-collapse:collapse; font-size:9px; }
  .inc-table th { background:#f8fafc; padding:5px 7px; text-align:left; font-size:8.5px; font-weight:700; color:#64748b; text-transform:uppercase; border-bottom:2px solid #e2e8f0; }
  .inc-table td { padding:5px 7px; border-bottom:1px solid #f1f5f9; vertical-align:top; word-break:break-word; }
  .inc-table tr:nth-child(even) td { background:#f8fafc; }
  .footer-bar { text-align:center; padding:10px 0 0; font-size:8.5px; color:#94a3b8; border-top:2px solid #e2e8f0; margin-top:14px; }
  .print-btn { position:fixed; bottom:20px; right:20px; background:linear-gradient(135deg,#1565c0,#0288d1); color:white; border:none; border-radius:10px; padding:12px 24px; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 4px 14px rgba(21,101,192,0.4); z-index:999; }
</style></head><body>
<div class="page">

  <div class="header-bar">
    <div>
      <h1>📋 Reporte de Equipos Médicos</h1>
      <p>${filtroCentro || "Todos los centros"}${filtroTipo ? " · " + (TIPO_LABELS[filtroTipo]||filtroTipo) : ""}</p>
    </div>
    <div class="header-right">
      Corporación Municipal de Panguipulli<br/>
      Departamento de Informática<br/>
      Generado: ${format(hoy,"dd/MM/yyyy")} a las ${format(hoy,"HH:mm")} hrs
    </div>
  </div>

  <div class="summary-bar">
    <div class="sum-card" style="background:#eff6ff;border-color:#bfdbfe"><div class="n" style="color:#2563eb">${equiposFiltrados.length}</div><div class="l">Total Equipos</div></div>
    <div class="sum-card" style="background:#dcfce7;border-color:#86efac"><div class="n" style="color:#16a34a">${totalOp}</div><div class="l">Operativos</div></div>
    <div class="sum-card" style="background:#fef9c3;border-color:#fde047"><div class="n" style="color:#ca8a04">${totalMant}</div><div class="l">En Mantención</div></div>
    <div class="sum-card" style="background:#fee2e2;border-color:#fca5a5"><div class="n" style="color:#dc2626">${totalFS}</div><div class="l">Fuera de Servicio</div></div>
  </div>

  <div class="section-title">🔧 Detalle de Equipos (${equiposFiltrados.length})</div>
  <div class="equipo-grid">${tarjetasEquipos || '<p style="color:#94a3b8;text-align:center;padding:20px;font-size:10px">Sin equipos para mostrar</p>'}</div>

  <div class="section-title" style="margin-top:18px">⚠️ Registro de Incidentes (${incFiltrados.length})</div>
  ${incFiltrados.length === 0
    ? '<p style="color:#94a3b8;font-size:10px;text-align:center;padding:12px">Sin incidentes registrados</p>'
    : `<table class="inc-table">
        <thead><tr>
          <th>Fecha</th><th>Inventario</th><th>Tipo Equipo</th><th>Centro</th><th>Causa</th><th>Descripción</th><th>Estado</th><th>Responsable</th>
        </tr></thead>
        <tbody>${filasIncidentes}</tbody>
       </table>`
  }

  <div class="footer-bar">
    <strong>Corporación Municipal de Panguipulli</strong> &nbsp;–&nbsp; Informe elaborado por departamento de informática<br/>
    <span style="font-size:8px">Documento generado automáticamente el ${format(hoy,"dd/MM/yyyy")} a las ${format(hoy,"HH:mm")} hrs &nbsp;|&nbsp; Sistema de Gestión de Equipos Médicos</span>
  </div>
</div>
<button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
</body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
    setGenerando(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#e8f4fd" }}>
      <div className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 40%, #29b6f6 100%)" }}>
        <div className="relative max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest">Documentos</p>
            <h1 className="text-3xl font-bold text-white">Reportes</h1>
            <p className="text-blue-100 text-sm mt-0.5">Generación de reportes en PDF</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-6 pb-10">
        <div className="bg-white rounded-3xl shadow p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" /> Configurar Reporte
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Centro Principal</label>
              <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={filtroCentro} onChange={e => setFiltroCentro(e.target.value)}>
                <option value="">Todos los centros</option>
                {CENTROS_ESTRUCTURA.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-2">Tipo de Equipo</label>
              <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                <option value="">Todos los tipos</option>
                {TIPOS_EQUIPO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Equipos", n: equipos.filter(e => (!filtroCentro || e.centro_principal === filtroCentro) && (!filtroTipo || e.tipo === filtroTipo)).length, color: "#2563eb" },
              { label: "Operativos", n: equipos.filter(e => e.estado === "operativo" && (!filtroCentro || e.centro_principal === filtroCentro)).length, color: "#16a34a" },
              { label: "Actividades", n: actividades.length, color: "#7c3aed" },
              { label: "Solicitudes", n: solicitudes.filter(s => s.estado !== "finalizada").length, color: "#d97706" }
            ].map(s => (
              <div key={s.label} className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.n}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={generarPDF}
            disabled={generando}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg disabled:opacity-60 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1565c0, #0288d1)" }}
          >
            {generando ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {generando ? "Generando PDF..." : "Generar Reporte PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}