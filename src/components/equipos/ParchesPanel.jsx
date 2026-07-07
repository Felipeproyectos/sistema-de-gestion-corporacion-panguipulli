import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";

export default function ParchesPanel({ equipoId, parches, onRefresh, isAdmin }) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tipo: "adulto", cantidad: 1, fecha_adquisicion: "", fecha_vencimiento: "", lote: ""
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const hoy = new Date();

  const getEstado = (venc) => {
    const dias = differenceInDays(parseISO(venc), hoy);
    if (dias < 0) return { label: "Vencido", color: "text-red-600 bg-red-50" };
    if (dias <= 30) return { label: `${dias}d`, color: "text-red-500 bg-red-50" };
    if (dias <= 90) return { label: `${dias}d`, color: "text-amber-600 bg-amber-50" };
    return { label: `${dias}d`, color: "text-green-600 bg-green-50" };
  };

  const handleAdd = async () => {
    setSaving(true);
    await base44.entities.Parche.create({ ...form, equipo_id: equipoId });
    setSaving(false);
    setAdding(false);
    setForm({ tipo: "adulto", cantidad: 1, fecha_adquisicion: "", fecha_vencimiento: "", lote: "" });
    onRefresh();
  };

  const handleDelete = async (id) => {
    await base44.entities.Parche.delete(id);
    onRefresh();
  };

  const inputCls = "border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-slate-50";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Parches</h3>
        {isAdmin && (
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-colors"
            style={{ background: "#e63946" }}
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        )}
      </div>

      {adding && (
        <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3 border border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Tipo</label>
              <select className={inputCls + " w-full"} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                <option value="adulto">Adulto</option>
                <option value="nino">Niño</option>
                <option value="mixto">Mixto (Adulto/Niño)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Cantidad</label>
              <input type="number" className={inputCls + " w-full"} value={form.cantidad} onChange={e => set("cantidad", parseInt(e.target.value))} min={1} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">F. Adquisición</label>
              <input type="date" className={inputCls + " w-full"} value={form.fecha_adquisicion} onChange={e => set("fecha_adquisicion", e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">F. Vencimiento *</label>
              <input type="date" className={inputCls + " w-full"} value={form.fecha_vencimiento} onChange={e => set("fecha_vencimiento", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">Lote</label>
              <input className={inputCls + " w-full"} value={form.lote} onChange={e => set("lote", e.target.value)} placeholder="Número de lote" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">Cancelar</button>
            <button onClick={handleAdd} disabled={saving || !form.fecha_vencimiento} className="text-xs px-4 py-1.5 rounded-lg text-white font-medium flex items-center gap-1 disabled:opacity-60" style={{ background: "#e63946" }}>
              {saving && <Loader2 className="w-3 h-3 animate-spin" />} Guardar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {parches.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Sin parches registrados</p>
        )}
        {parches.map(p => {
          const estado = p.fecha_vencimiento ? getEstado(p.fecha_vencimiento) : null;
          return (
            <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${p.tipo === "adulto" ? "bg-blue-500" : p.tipo === "nino" ? "bg-pink-500" : "bg-purple-500"}`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {p.tipo === "nino" ? "Niño" : p.tipo === "mixto" ? "Mixto" : "Adulto"} — {p.cantidad} ud{p.cantidad > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-slate-400">
                    Vence: {p.fecha_vencimiento ? format(parseISO(p.fecha_vencimiento), "dd/MM/yyyy") : "—"}
                    {p.lote ? ` · Lote: ${p.lote}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {estado && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${estado.color}`}>{estado.label}</span>
                )}
                {isAdmin && (
                  <button onClick={() => handleDelete(p.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}