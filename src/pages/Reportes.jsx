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

  const [tipoReporte, setTipoReporte] = useState("centro");
  const [filtroCentro, setFiltroCentro] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

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

    const filas = equiposFiltrados.map(eq => {
      const estado = ESTADOS_EQUIPO.find(e => e.value === eq.estado);
      const tipo = TIPOS_EQUIPO.find(t => t.value === eq.tipo);
      const actEq = actividades.filter(a => a.equipo_id === eq.id);
      const incEq = actEq.filter(a => a.tipo === "incidente");
      const solEq = solicitudes.filter(s => s.equipo_id === eq.id && s.estado !== "finalizada");
      const ultimoInc = incEq.sort((a,b) => new Date(b.fecha)-new Date(a.fecha))[0];
      const incCell = incEq.length === 0
        ? "—"
        : `<span style="color:#dc2626;font-weight:600">${incEq.length} incidente(s)</span><br/><span style="font-size:9px;color:#64748b">${ultimoInc?.tipo_incidente ? TIPO_INC_LABEL[ultimoInc.tipo_incidente] : "Sin clasificar"}</span>`;
      return `
        <tr>
          <td>${eq.numero_inventario || ""}</td>
          <td>${tipo?.label || eq.tipo}</td>
          <td>${eq.marca} ${eq.modelo}</td>
          <td>${eq.centro_principal}${eq.subsede ? ` / ${eq.subsede}` : ""}</td>
          <td><span style="color:${estado?.color};font-weight:600">${estado?.label || eq.estado}</span></td>
          <td>${incCell}</td>
          <td>${actEq.length}</td>
          <td>${solEq.length > 0 ? `<span style="color:#d97706">${solEq.length} pendiente(s)</span>` : "—"}</td>
        </tr>`;
    }).join("");

    const todosIncidentes = actividades
      .filter(a => a.tipo === "incidente")
      .filter(a => {
        const eq = equipos.find(e => e.id === a.equipo_id);
        if (!eq) return false;
        if (filtroCentro && eq.centro_principal !== filtroCentro) return false;
        if (filtroTipo && eq.tipo !== filtroTipo) return false;
        return true;
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const filasIncidentes = todosIncidentes.map(inc => {
      const eq = equipos.find(e => e.id === inc.equipo_id);
      const tipoEq = TIPOS_EQUIPO.find(t => t.value === eq?.tipo);
      const causaLabel = TIPO_INC_LABEL[inc.tipo_incidente] || "Sin clasificar";
      const opLabel = eq?.tipo === "ambulancia"
        ? (inc.ambulancia_operativa === false ? `<span style="color:#dc2626;font-weight:600">Fuera Servicio</span>` : `<span style="color:#16a34a;font-weight:600">Operativa</span>`)
        : "N/A";
      return `
        <tr>
          <td>${inc.fecha || ""}</td>
          <td>${eq?.numero_inventario || ""}</td>
          <td>${tipoEq?.label || eq?.tipo || ""}</td>
          <td>${eq?.marca || ""} ${eq?.modelo || ""}</td>
          <td>${eq?.centro_principal || ""}${eq?.subsede ? ` / ${eq.subsede}` : ""}</td>
          <td><span style="background:#FEF2F2;color:#dc2626;padding:2px 5px;border-radius:4px;font-size:9px;font-weight:600">${causaLabel}</span></td>
          <td style="word-wrap:break-word">${inc.observaciones || "—"}</td>
          <td>${opLabel}</td>
          <td>${inc.usuario_nombre || "—"}</td>
        </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Reporte Equipos Médicos</title>
<style>
  @page { size: letter landscape; margin: 15mm; }
  @media print { .no-print { display:none!important; } body { background:white; } }
  * { box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#f0f4f8; margin:0; padding:20px; color:#1e293b; }
  .page { background:white; width:100%; max-width:260mm; margin:0 auto; padding:20px; }
  .header { background:linear-gradient(135deg,#1e3a5f,#2563eb); border-radius:10px; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
  .header h1 { color:white; margin:0; font-size:18px; }
  .header p { color:rgba(255,255,255,0.75); margin:0; font-size:11px; }
  .header-right { color:rgba(255,255,255,0.85); font-size:11px; text-align:right; }
  .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:16px; }
  .card { background:white; border-radius:8px; padding:10px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.07); border-top:3px solid var(--cc); }
  .card .n { font-size:22px; font-weight:700; color:var(--cc); }
  .card .l { font-size:9px; color:#64748b; text-transform:uppercase; font-weight:600; }
  table { width:100%; border-collapse:collapse; font-size:10px; table-layout:fixed; }
  thead tr { background:#f8fafc; }
  thead th { padding:8px 6px; text-align:left; font-size:9px; font-weight:700; color:#64748b; text-transform:uppercase; border-bottom:2px solid #e2e8f0; }
  tbody td { padding:6px; border-bottom:1px solid #f1f5f9; word-wrap:break-word; }
  tbody tr:nth-child(even) { background:#f8fafc; }
  .footer { text-align:center; padding:12px 0 0; font-size:9px; color:#94a3b8; border-top:1px solid #e2e8f0; margin-top:8px; }
  .print-btn { position:fixed; bottom:20px; right:20px; background:#2563eb; color:white; border:none; border-radius:10px; padding:10px 20px; font-size:13px; font-weight:600; cursor:pointer; }
</style></head><body>
<div class="page">
  <div class="header">
    <div><h1>📋 Reporte de Equipos Médicos</h1><p>${filtroCentro || "Todos los centros"} ${filtroTipo ? "· " + (TIPOS_EQUIPO.find(t=>t.value===filtroTipo)?.label||"") : ""}</p></div>
    <div class="header-right">Corporación Municipal Panguipulli<br/>Departamento Informática – Área Salud<br/>Generado: ${format(hoy,"dd/MM/yyyy HH:mm")}</div>
  </div>
  <div class="summary">
    <div class="card" style="--cc:#2563eb"><div class="n">${equiposFiltrados.length}</div><div class="l">Total Equipos</div></div>
    <div class="card" style="--cc:#16a34a"><div class="n">${equiposFiltrados.filter(e=>e.estado==="operativo").length}</div><div class="l">Operativos</div></div>
    <div class="card" style="--cc:#d97706"><div class="n">${equiposFiltrados.filter(e=>e.estado==="mantenimiento").length}</div><div class="l">En Mantención</div></div>
    <div class="card" style="--cc:#dc2626"><div class="n">${equiposFiltrados.filter(e=>e.estado==="fuera_de_servicio").length}</div><div class="l">Fuera Servicio</div></div>
  </div>
  <table>
    <thead><tr>
      <th style="width:9%">Inventario</th>
      <th style="width:13%">Tipo</th>
      <th style="width:16%">Equipo</th>
      <th style="width:20%">Centro / Subsede</th>
      <th style="width:11%">Estado</th>
      <th style="width:13%">Incidentes</th>
      <th style="width:8%">Activ.</th>
      <th style="width:10%">Solicitudes</th>
    </tr></thead>
    <tbody>${filas || '<tr><td colspan="8" style="text-align:center;padding:16px;color:#94a3b8">Sin equipos</td></tr>'}</tbody>
  </table>
  <div style="margin-top:24px;">
    <div style="background:linear-gradient(135deg,#7f1d1d,#dc2626);border-radius:8px;padding:10px 16px;margin-bottom:12px;"><h2 style="color:white;margin:0;font-size:14px;">&#9888; Detalle de Incidentes (${todosIncidentes.length})</h2><p style="color:rgba(255,255,255,0.75);margin:0;font-size:10px;">Todas las incidencias registradas${filtroCentro ? ' en ' + filtroCentro : ''}</p></div>
    ${todosIncidentes.length === 0 ? '<p style="text-align:center;color:#94a3b8;padding:16px;font-size:11px;">Sin incidentes registrados</p>' : `<table><thead><tr><th style="width:8%">Fecha</th><th style="width:9%">Inventario</th><th style="width:10%">Tipo Equipo</th><th style="width:13%">Equipo</th><th style="width:15%">Centro</th><th style="width:10%">Causa</th><th style="width:20%">Descripción</th><th style="width:9%">Estado Amb.</th><th style="width:6%">Reportado por</th></tr></thead><tbody>${filasIncidentes}</tbody></table>`}
  </div>
  <div class="footer">Corporación Municipal Panguipulli &nbsp;–&nbsp; Departamento Informática &nbsp;–&nbsp; Área Salud<br/>Informe generado automáticamente el ${format(hoy,"dd/MM/yyyy")} a las ${format(hoy,"HH:mm")} hrs</div>
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

          {/* Preview stats */}
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