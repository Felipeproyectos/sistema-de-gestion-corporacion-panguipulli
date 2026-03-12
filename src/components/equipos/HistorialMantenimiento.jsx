import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Calendar, CheckCircle, AlertTriangle, XCircle, Loader2, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function HistorialMantenimiento({ equipoId, isAdmin }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fecha_inspeccion: new Date().toISOString().split('T')[0],
    tipo_mantenimiento: "inspeccion_rutinaria",
    resultado: "aprobado",
    pruebas_realizadas: "",
    observaciones: "",
    tecnico_responsable: "",
    proximo_mantenimiento: ""
  });

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.HistorialMantenimiento.filter(
      { equipo_id: equipoId },
      "-fecha_inspeccion"
    ).catch(() => []);
    setHistorial(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [equipoId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    setSaving(true);
    await base44.entities.HistorialMantenimiento.create({ ...form, equipo_id: equipoId });
    setSaving(false);
    setAdding(false);
    setForm({
      fecha_inspeccion: new Date().toISOString().split('T')[0],
      tipo_mantenimiento: "inspeccion_rutinaria",
      resultado: "aprobado",
      pruebas_realizadas: "",
      observaciones: "",
      tecnico_responsable: "",
      proximo_mantenimiento: ""
    });
    load();
  };

  const tipoLabels = {
    preventivo: "Preventivo",
    correctivo: "Correctivo",
    calibracion: "Calibración",
    inspeccion_rutinaria: "Inspección Rutinaria"
  };

  const resultadoConfig = {
    aprobado: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Aprobado" },
    aprobado_con_observaciones: { icon: AlertTriangle, color: "text-amber-600 bg-amber-50", label: "Con Observaciones" },
    rechazado: { icon: XCircle, color: "text-red-600 bg-red-50", label: "Rechazado" }
  };

  const inputCls = "border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-slate-50 w-full";

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Historial de Mantenimiento</h3>
        {isAdmin && (
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
            style={{ background: "#e63946" }}
          >
            <Plus className="w-3.5 h-3.5" /> Registrar
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3 border border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Fecha de Inspección *</label>
              <input type="date" className={inputCls} value={form.fecha_inspeccion} onChange={e => set("fecha_inspeccion", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tipo de Mantenimiento *</label>
              <select className={inputCls} value={form.tipo_mantenimiento} onChange={e => set("tipo_mantenimiento", e.target.value)}>
                <option value="inspeccion_rutinaria">Inspección Rutinaria</option>
                <option value="preventivo">Preventivo</option>
                <option value="correctivo">Correctivo</option>
                <option value="calibracion">Calibración</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Resultado *</label>
              <select className={inputCls} value={form.resultado} onChange={e => set("resultado", e.target.value)}>
                <option value="aprobado">Aprobado</option>
                <option value="aprobado_con_observaciones">Aprobado con Observaciones</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Técnico Responsable</label>
              <input className={inputCls} value={form.tecnico_responsable} onChange={e => set("tecnico_responsable", e.target.value)} placeholder="Nombre del técnico" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Pruebas Técnicas Realizadas</label>
              <textarea className={inputCls} rows={2} value={form.pruebas_realizadas} onChange={e => set("pruebas_realizadas", e.target.value)} placeholder="Detalle de las pruebas realizadas..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Observaciones</label>
              <textarea className={inputCls} rows={2} value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Notas adicionales de la revisión..." />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Próximo Mantenimiento</label>
              <input type="date" className={inputCls} value={form.proximo_mantenimiento} onChange={e => set("proximo_mantenimiento", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setAdding(false)} className="text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">Cancelar</button>
            <button onClick={handleAdd} disabled={saving} className="text-xs px-4 py-1.5 rounded-lg text-white font-medium flex items-center gap-1 disabled:opacity-60" style={{ background: "#e63946" }}>
              {saving && <Loader2 className="w-3 h-3 animate-spin" />} Guardar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {historial.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-400">Sin registros de mantenimiento</p>
          </div>
        )}
        {historial.map(h => {
          const ResultIcon = resultadoConfig[h.resultado].icon;
          return (
            <div key={h.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{tipoLabels[h.tipo_mantenimiento]}</p>
                    <p className="text-xs text-slate-400">{format(parseISO(h.fecha_inspeccion), "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${resultadoConfig[h.resultado].color}`}>
                  <ResultIcon className="w-3.5 h-3.5" />
                  {resultadoConfig[h.resultado].label}
                </div>
              </div>

              {h.pruebas_realizadas && (
                <div className="mb-2">
                  <p className="text-xs text-slate-500 mb-1">Pruebas realizadas:</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{h.pruebas_realizadas}</p>
                </div>
              )}

              {h.observaciones && (
                <div className="mb-2">
                  <p className="text-xs text-slate-500 mb-1">Observaciones:</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{h.observaciones}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                {h.tecnico_responsable && (
                  <span>Técnico: <span className="text-slate-700 font-medium">{h.tecnico_responsable}</span></span>
                )}
                {h.proximo_mantenimiento && (
                  <span>Próximo: <span className="text-slate-700 font-medium">{format(parseISO(h.proximo_mantenimiento), "dd/MM/yyyy")}</span></span>
                )}
                <span className="ml-auto text-slate-400">Por: {h.created_by}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}