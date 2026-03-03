import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, Loader2 } from "lucide-react";

const ESTADOS = ["operativo", "mantenimiento", "fuera_de_servicio"];

export default function EquipoForm({ equipo, onClose, onSaved }) {
  const [form, setForm] = useState(equipo || {
    marca: "", modelo: "", numero_serie: "", anio_adquisicion: new Date().getFullYear(),
    establecimiento: "", lugar_destinado: "", valor: "", estado: "operativo",
    orden_compra_url: "", notas: "", usuarios_asignados: []
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("orden_compra_url", file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (equipo?.id) {
      await base44.entities.EquipoDEA.update(equipo.id, form);
    } else {
      await base44.entities.EquipoDEA.create(form);
    }
    setSaving(false);
    onSaved();
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent bg-slate-50";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-3xl px-7 pt-7 pb-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{equipo ? "Editar Equipo" : "Nuevo Equipo DEA"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-7 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Marca *</label>
              <input className={inputCls} value={form.marca} onChange={e => set("marca", e.target.value)} placeholder="Ej: Zoll, Philips" />
            </div>
            <div>
              <label className={labelCls}>Modelo *</label>
              <input className={inputCls} value={form.modelo} onChange={e => set("modelo", e.target.value)} placeholder="Ej: AED Plus" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Número de Serie *</label>
              <input className={inputCls} value={form.numero_serie} onChange={e => set("numero_serie", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Año de Adquisición</label>
              <input className={inputCls} type="number" value={form.anio_adquisicion} onChange={e => set("anio_adquisicion", parseInt(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Establecimiento *</label>
              <input className={inputCls} value={form.establecimiento} onChange={e => set("establecimiento", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Lugar Destinado</label>
              <input className={inputCls} value={form.lugar_destinado} onChange={e => set("lugar_destinado", e.target.value)} placeholder="Ej: Recepción piso 2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Valor del Equipo ($)</label>
              <input className={inputCls} type="number" value={form.valor} onChange={e => set("valor", e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select className={inputCls} value={form.estado} onChange={e => set("estado", e.target.value)}>
                {ESTADOS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Orden de Compra / Factura (PDF)</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-500 hover:border-red-400 hover:text-red-500 transition-colors bg-slate-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Subiendo..." : "Subir PDF"}
                <input type="file" accept=".pdf" className="hidden" onChange={handleFile} />
              </label>
              {form.orden_compra_url && (
                <a href={form.orden_compra_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Ver archivo</a>
              )}
            </div>
          </div>

          <div>
            <label className={labelCls}>Notas</label>
            <textarea className={inputCls} rows={3} value={form.notas} onChange={e => set("notas", e.target.value)} />
          </div>
        </div>

        <div className="px-7 pb-7 flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2 disabled:opacity-60"
            style={{ background: "#e63946" }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {equipo ? "Guardar Cambios" : "Crear Equipo"}
          </button>
        </div>
      </div>
    </div>
  );
}