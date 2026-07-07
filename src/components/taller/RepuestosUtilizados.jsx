import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Package, Plus, X, Lock } from "lucide-react";

// Nota: los repuestos utilizados se registran aquí como "intención de uso"
// mientras la OT está abierta. El stock real (Repuesto.stock_actual) sólo se
// descuenta UNA vez, al cerrar la OT (ver OrdenTrabajoDetalle.jsx,
// handleCambiarEstado -> estado "completada"), para evitar descuentos
// duplicados o parciales mientras el mecánico sigue ajustando cantidades.
export default function RepuestosUtilizados({ ot, repuestosDisponibles, onUpdate, editable }) {
  const [agregando, setAgregando] = useState(false);
  const [repuestoId, setRepuestoId] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const items = ot.repuestos_utilizados || [];
  const cerrada = ot.estado === "completada";

  const handleAgregar = async () => {
    if (!repuestoId || cantidad <= 0) return;
    const rep = repuestosDisponibles.find(r => r.id === repuestoId);
    if (!rep) return;
    const nuevoItem = {
      repuesto_id: rep.id,
      repuesto_nombre: rep.nombre,
      cantidad: Number(cantidad),
    };
    const nuevosItems = [...items, nuevoItem];
    await base44.entities.OrdenTrabajo.update(ot.id, { repuestos_utilizados: nuevosItems });
    setRepuestoId("");
    setCantidad(1);
    setAgregando(false);
    onUpdate?.();
  };

  const handleQuitar = async (idx) => {
    const nuevosItems = items.filter((_, i) => i !== idx);
    await base44.entities.OrdenTrabajo.update(ot.id, { repuestos_utilizados: nuevosItems });
    onUpdate?.();
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Package className="w-4 h-4 text-orange-500" /> Repuestos utilizados
        </h3>
        {cerrada && (
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3" /> OT cerrada · stock ya descontado
          </span>
        )}
        {editable && !cerrada && (
          <button onClick={() => setAgregando(v => !v)} className="text-xs font-semibold text-orange-600 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400">Sin repuestos registrados</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-sm text-slate-700">{it.repuesto_nombre}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">x{it.cantidad}</span>
                {editable && !cerrada && (
                  <button onClick={() => handleQuitar(idx)} className="text-slate-300 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {agregando && editable && !cerrada && (
        <div className="mt-3 flex items-center gap-2">
          <select value={repuestoId} onChange={e => setRepuestoId(e.target.value)}
            className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5">
            <option value="">Seleccionar repuesto...</option>
            {repuestosDisponibles.map(r => (
              <option key={r.id} value={r.id}>{r.nombre} (stock: {r.stock_actual ?? 0})</option>
            ))}
          </select>
          <input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)}
            className="w-16 text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
          <button onClick={handleAgregar} className="text-xs font-bold text-white bg-orange-500 rounded-lg px-3 py-1.5">
            Añadir
          </button>
        </div>
      )}
    </div>
  );
}
