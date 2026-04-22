import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, AlertTriangle, Car, ClipboardCheck, User } from "lucide-react";

const TIPO_LABEL = {
  inspeccion_semanal: "Pauta Semanal",
  turno_chofer: "Turno Chofer",
  inspeccion_diaria: "Pauta Diaria",
  inspeccion_anual: "Pauta Anual",
};

const ESTADO_CFG = {
  pendiente: { label: "Pendiente", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  aprobado: { label: "Aprobado", color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  rechazado: { label: "Rechazado", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
};

function InspeccionCard({ insp, onActualizar }) {
  const [expanded, setExpanded] = useState(false);
  const [nota, setNota] = useState("");
  const [processing, setProcessing] = useState(false);

  const estado = ESTADO_CFG[insp.estado] || ESTADO_CFG.pendiente;
  const lineas = insp.observaciones?.split(" | ").filter(Boolean) || [];
  const hasFallas = insp.observaciones?.includes("Fallas:");

  const handleAccion = async (accion) => {
    setProcessing(true);
    await base44.functions.invoke("aprobarInspeccion", {
      inspeccion_id: insp.id,
      accion,
      nota,
    });
    setProcessing(false);
    onActualizar();
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: `1px solid ${estado.border}` }}>
      {/* Header */}
      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: estado.bg }}>
          <ClipboardCheck className="w-5 h-5" style={{ color: estado.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-800">{TIPO_LABEL[insp.tipo_formulario] || insp.tipo_formulario}</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: estado.bg, color: estado.color }}>
              {estado.label}
            </span>
            {hasFallas && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                Con fallas
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {insp.equipo_label || insp.equipo_id} · {insp.fecha}
            {insp.conductor && ` · ${insp.conductor}`}
          </p>
          {insp.km_inicial && (
            <p className="text-xs text-blue-600 mt-0.5">KM Inicial: {Number(insp.km_inicial).toLocaleString()}</p>
          )}
        </div>
        <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3" style={{ background: "#FAFBFC" }}>
          {/* Observaciones */}
          {lineas.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detalles de la Inspección</p>
              {lineas.map((linea, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 px-3 rounded-lg text-xs"
                  style={{
                    background: linea.includes("Fallas:") || linea.startsWith("Daños") ? "#FFF5F5" : "white",
                    border: linea.includes("Fallas:") || linea.startsWith("Daños") ? "1px solid #FECACA" : "1px solid #E2E8F0",
                    color: linea.includes("Fallas:") || linea.startsWith("Daños") ? "#DC2626" : "#475569"
                  }}>
                  <span className="flex-shrink-0 mt-0.5">
                    {linea.includes("Fallas:") || linea.startsWith("Daños") ? "⚠" : "•"}
                  </span>
                  <p className="leading-relaxed">{linea}</p>
                </div>
              ))}
            </div>
          )}

          {/* Nota del revisor (ya revisado) */}
          {insp.estado !== "pendiente" && (
            <div className="p-3 rounded-xl text-sm" style={{ background: estado.bg, border: `1px solid ${estado.border}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: estado.color }}>
                {insp.estado === "aprobado" ? "✓ Aprobado" : "✗ Rechazado"} por {insp.revisor_nombre || insp.revisor_email}
              </p>
              {insp.nota_revision && <p className="text-xs" style={{ color: estado.color }}>{insp.nota_revision}</p>}
            </div>
          )}

          {/* Acciones (solo pendientes) */}
          {insp.estado === "pendiente" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Nota al conductor (opcional)</label>
                <textarea rows={2} placeholder="Ej: KM no coincide con el anterior registro..."
                  value={nota} onChange={e => setNota(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccion("rechazar")}
                  disabled={processing}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
                <button
                  onClick={() => handleAccion("aprobar")}
                  disabled={processing}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "#16A34A" }}>
                  <CheckCircle className="w-4 h-4" /> Aprobar y Sincronizar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RevisionInspecciones() {
  const [inspecciones, setInspecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const cargar = async () => {
    setLoading(true);
    const data = await base44.entities.InspeccionPendiente.list("-created_date", 100);
    setInspecciones(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="font-bold text-slate-700">Acceso restringido</p>
          <p className="text-sm text-slate-400 mt-1">Solo administradores pueden revisar inspecciones.</p>
        </div>
      </div>
    );
  }

  const filtradas = inspecciones.filter(i => filtro === "todos" || i.estado === filtro);
  const pendientes = inspecciones.filter(i => i.estado === "pendiente").length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Revisión de Inspecciones</h1>
            {pendientes > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "#EF4444" }}>
                {pendientes} pendiente{pendientes > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">Revisa y aprueba los formularios enviados desde la bitácora pública antes de sincronizarlos al sistema.</p>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-5">
          {[
            { value: "pendiente", label: "Pendientes" },
            { value: "aprobado", label: "Aprobados" },
            { value: "rechazado", label: "Rechazados" },
            { value: "todos", label: "Todos" },
          ].map(f => (
            <button key={f.value} onClick={() => setFiltro(f.value)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={filtro === f.value
                ? { background: "#1D4ED8", color: "white" }
                : { background: "white", color: "#64748B", border: "1px solid #E2E8F0" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Cargando...</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No hay registros {filtro !== "todos" ? `con estado "${filtro}"` : ""}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map(insp => (
              <InspeccionCard key={insp.id} insp={insp} onActualizar={cargar} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}