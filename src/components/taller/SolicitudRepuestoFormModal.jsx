import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CATS = ["neumaticos", "frenos", "bateria", "filtros", "lubricantes", "electrico", "sirena", "luces", "otros"];

export default function SolicitudRepuestoFormModal({ open, onClose, onGuardar, user }) {
  const [form, setForm] = useState({ repuesto_nombre: "", categoria: "otros", cantidad: 1, urgencia: "media", motivo: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.repuesto_nombre.trim()) { toast({ title: "Indica el repuesto", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const numero = `SR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-5)}`;
      await base44.entities.SolicitudRepuesto.create({
        ...form,
        cantidad: Number(form.cantidad) || 1,
        numero_solicitud: numero,
        solicitante_email: user?.email,
        solicitante_nombre: user?.full_name,
        estado: "pendiente",
        fecha_solicitud: new Date().toISOString().split("T")[0],
      });
      toast({ title: "Solicitud enviada", description: "Será revisada por el Jefe de Taller" });
      setForm({ repuesto_nombre: "", categoria: "otros", cantidad: 1, urgencia: "media", motivo: "" });
      onGuardar();
      onClose();
    } catch (e) {
      toast({ title: "No se pudo crear", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const input = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-slate-50";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Nueva Solicitud de Repuesto</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500">Repuesto solicitado</label>
            <input className={input} value={form.repuesto_nombre} onChange={e => set("repuesto_nombre", e.target.value)} placeholder="Ej. Filtro de aceite" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">Categoría</label>
              <select className={input} value={form.categoria} onChange={e => set("categoria", e.target.value)}>
                {CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Cantidad</label>
              <input type="number" min="1" className={input} value={form.cantidad} onChange={e => set("cantidad", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Urgencia</label>
            <select className={input} value={form.urgencia} onChange={e => set("urgencia", e.target.value)}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Motivo / justificación</label>
            <textarea rows={2} className={input} value={form.motivo} onChange={e => set("motivo", e.target.value)} placeholder="¿Para qué se necesita?" />
          </div>
          <p className="text-xs text-slate-400">La solicitud será revisada y aprobada por el Jefe de Taller.</p>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100">Cancelar</button>
          <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5" style={{ background: "#D97706" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Solicitud"}
          </button>
        </div>
      </div>
    </div>
  );
}