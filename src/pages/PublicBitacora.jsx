import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Car, CheckCircle, Loader2, AlertTriangle, ClipboardCheck } from "lucide-react";
import PautaInspeccionSemanal from "@/components/bitacora/PautaInspeccionSemanal";

export default function PublicBitacora() {
  const [equipos, setEquipos] = useState([]);
  const [mode, setMode] = useState(null); // "bitacora" | "pauta"
  const [form, setForm] = useState({
    equipo_id: "",
    conductor: "",
    fecha: new Date().toISOString().split("T")[0],
    km_inicial: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    base44.functions.invoke("getPublicAmbulances", {})
      .then(res => setEquipos(res.data?.equipos || []))
      .catch(() => setError("No se pudieron cargar los equipos. Intenta recargar la página."));
  }, []);

  const handleSubmitBitacora = async (e) => {
    e.preventDefault();
    if (!form.equipo_id || !form.conductor || !form.km_inicial) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }
    setError("");
    setSaving(true);
    const res = await base44.functions.invoke("submitPublicBitacora", {
      ...form,
      km_inicial: Number(form.km_inicial),
      valor_km: Number(form.km_inicial),
    });
    setSaving(false);
    if (res.data?.ok) {
      setSuccessMsg("Registro guardado correctamente en el sistema.");
      setSuccess(true);
      setForm({ equipo_id: "", conductor: "", fecha: new Date().toISOString().split("T")[0], km_inicial: "", observaciones: "" });
    } else {
      setError("Ocurrió un error al guardar. Por favor intenta de nuevo.");
    }
  };

  const handlePautaSuccess = ({ hasFallas, conductor }) => {
    setSuccessMsg(`Inspección registrada para ${conductor}.${hasFallas ? " Se detectaron fallas, notifica al responsable." : " Vehículo en buen estado."}`);
    setSuccess(true);
  };

  const equipo = equipos.find(e => e.id === form.equipo_id);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 60%, #29b6f6 100%)" }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Manrope, sans-serif" }}>Bitácora de Conductores</h1>
          <p className="text-blue-200 mt-2 text-sm">Registro de ambulancias</p>
        </div>

        {/* Éxito */}
        {success ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "#DCFCE7" }}>
              <CheckCircle className="w-9 h-9 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">¡Guardado exitosamente!</h2>
            <p className="text-slate-500 text-sm">{successMsg}</p>
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={() => { setSuccess(false); setMode(null); }}
                className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#2563EB" }}>
                Volver al inicio
              </button>
            </div>
          </div>
        ) : !mode ? (
          /* Selector de modo */
          <div className="space-y-4">
            <button onClick={() => setMode("bitacora")}
              className="w-full bg-white rounded-3xl shadow-xl p-6 text-left hover:shadow-2xl transition-shadow flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-base">Registro de Turno</p>
                <p className="text-sm text-slate-500 mt-0.5">Registra el inicio de turno con conductor y kilometraje</p>
              </div>
            </button>

            <button onClick={() => setMode("pauta")}
              className="w-full bg-white rounded-3xl shadow-xl p-6 text-left hover:shadow-2xl transition-shadow flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#F0FDF4" }}>
                <ClipboardCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-base">Pauta de Inspección Semanal</p>
                <p className="text-sm text-slate-500 mt-0.5">Inspección completa del vehículo: luces, motor, accesorios y documentos</p>
                <span className="inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                  Ambulancias
                </span>
              </div>
            </button>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
          </div>
        ) : mode === "bitacora" ? (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <button onClick={() => setMode(null)} className="text-xs text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1">
              ← Volver
            </button>
            <h2 className="text-lg font-bold text-slate-800 mb-5">Registro de Turno</h2>
            <form onSubmit={handleSubmitBitacora} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">Ambulancia *</label>
                <select required value={form.equipo_id}
                  onChange={e => setForm(f => ({ ...f, equipo_id: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50">
                  <option value="">Selecciona una ambulancia...</option>
                  {equipos.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.marca} {eq.modelo}{eq.patente ? ` — ${eq.patente}` : ""} ({eq.centro_principal})
                    </option>
                  ))}
                </select>
                {equipo && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    {equipo.centro_principal}{equipo.subsede ? ` · ${equipo.subsede}` : ""}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">Nombre del conductor *</label>
                <input required type="text" placeholder="Ej: Juan Pérez" value={form.conductor}
                  onChange={e => setForm(f => ({ ...f, conductor: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">Fecha *</label>
                  <input required type="date" value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">KM Inicial *</label>
                  <input required type="number" min="0" placeholder="Ej: 45230" value={form.km_inicial}
                    onChange={e => setForm(f => ({ ...f, km_inicial: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-widest">Observaciones</label>
                <textarea rows={3} placeholder="Algún detalle adicional del turno..." value={form.observaciones}
                  onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50 resize-none" />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              <button type="submit" disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Registrar en Bitácora"}
              </button>
            </form>
          </div>
        ) : (
          /* Pauta semanal */
          <div>
            <button onClick={() => setMode(null)} className="text-xs text-white/70 hover:text-white mb-4 flex items-center gap-1">
              ← Volver
            </button>
            <PautaInspeccionSemanal equipos={equipos} onSuccess={handlePautaSuccess} />
          </div>
        )}

        <p className="text-center text-blue-200 text-xs mt-6 opacity-70">
          Sistema de Gestión de Equipos Médicos
        </p>
      </div>
    </div>
  );
}