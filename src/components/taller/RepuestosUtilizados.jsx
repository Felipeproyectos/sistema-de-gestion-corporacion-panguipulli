import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Package, Loader2 } from "lucide-react";

export default function RepuestosUtilizados({ ot, repuestos, onActualizado, user, editable }) {
  const [agregando, setAgregando] = useState(false);
  const [repSel, setRepSel] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [guardando, setGuardando] = useState(false);

  const utilizados = ot.repuestos_utilizados || [];

  const repuestoSel = repuestos.find(r => r.id === repSel);

  const handleAgregar = async () => {
    if (!repSel || cantidad <= 0) return;
    setGuardando(true);
    try {
      const precio = repuestoSel?.precio_unitario || 0;
      const nuevoItem = {
        repuesto_id: repuestoSel.id,
        nombre: repuestoSel.nombre,
        cantidad: Number(cantidad),
        precio_unitario: precio,
        subtotal: precio * Number(cantidad),
        proveedor_nombre: repuestoSel.proveedor_nombre || "",
      };
      const nuevosRep = [...utilizados, nuevoItem];
      const totalRep = nuevosRep.reduce((s, r) => s + (r.subtotal || 0), 0);
      const totalMO = ot.total_mano_obra || 0;
      await base44.entities.OrdenTrabajo.update(ot.id, {
        repuestos_utilizados: nuevosRep,
        total_repuestos: totalRep,
        total: totalRep + totalMO,
        linea_tiempo: [...(ot.linea_tiempo || []), {
          fecha: new Date().toISOString(),
          evento: "Repuesto agregado",
          usuario_email: user?.email,
          usuario_nombre: user?.full_name,
          notas: `${nuevoItem.nombre} x${nuevoItem.cantidad} ($${nuevoItem.subtotal.toLocaleString("es-CL")})`,
        }],
      });
      // Descontar stock
      await base44.entities.Repuesto.update(repuestoSel.id, {
        stock_actual: Math.max(0, (repuestoSel.stock_actual || 0) - Number(cantidad)),
      });
      setRepSel("");
      setCantidad(1);
      setAgregando(false);
      onActualizado();
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  const handleQuitar = async (idx) => {
    setGuardando(true);
    try {
      const item = utilizados[idx];
      const nuevosRep = utilizados.filter((_, i) => i !== idx);
      const totalRep = nuevosRep.reduce((s, r) => s + (r.subtotal || 0), 0);
      const totalMO = ot.total_mano_obra || 0;
      await base44.entities.OrdenTrabajo.update(ot.id, {
        repuestos_utilizados: nuevosRep,
        total_repuestos: totalRep,
        total: totalRep + totalMO,
        linea_tiempo: [...(ot.linea_tiempo || []), {
          fecha: new Date().toISOString(),
          evento: "Repuesto retirado",
          usuario_email: user?.email,
          usuario_nombre: user?.full_name,
          notas: `${item.nombre} x${item.cantidad}`,
        }],
      });
      // Reponer stock
      if (item.repuesto_id) {
        const rep = repuestos.find(r => r.id === item.repuesto_id);
        if (rep) {
          await base44.entities.Repuesto.update(rep.id, {
            stock_actual: (rep.stock_actual || 0) + Number(item.cantidad),
          });
        }
      }
      onActualizado();
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Package className="w-4 h-4 text-violet-600" /> Repuestos Utilizados
        </h3>
        {editable && (
          <button onClick={() => setAgregando(!agregando)}
            className="text-xs font-bold text-blue-600 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        )}
      </div>

      {agregando && (
        <div className="mb-3 p-3 rounded-xl bg-violet-50 space-y-2">
          <select value={repSel} onChange={e => setRepSel(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Seleccionar repuesto...</option>
            {repuestos.filter(r => (r.stock_actual || 0) > 0).map(r => (
              <option key={r.id} value={r.id}>
                {r.nombre} (stock: {r.stock_actual}) - ${r.precio_unitario || 0}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)}
              className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Cant." />
            <div className="flex-1 text-right self-center">
              {repuestoSel && <span className="text-xs text-slate-500">Subtotal: <b>${((repuestoSel.precio_unitario || 0) * Number(cantidad)).toLocaleString("es-CL")}</b></span>}
            </div>
            <button onClick={handleAgregar} disabled={guardando || !repSel}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 flex items-center gap-1"
              style={{ background: "#7C3AED" }}>
              {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "OK"}
            </button>
          </div>
        </div>
      )}

      {utilizados.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">No se han utilizado repuestos.</p>
      ) : (
        <div className="space-y-1.5">
          {utilizados.map((r, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{r.nombre}</p>
                <p className="text-xs text-slate-400">{r.cantidad} x ${r.precio_unitario.toLocaleString("es-CL")}{r.proveedor_nombre ? ` · ${r.proveedor_nombre}` : ""}</p>
              </div>
              <span className="text-sm font-bold text-slate-700">${(r.subtotal || 0).toLocaleString("es-CL")}</span>
              {editable && (
                <button onClick={() => handleQuitar(i)} disabled={guardando}
                  className="text-slate-300 hover:text-red-500">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500">Total Repuestos</span>
            <span className="text-sm font-bold text-violet-700">${(ot.total_repuestos || 0).toLocaleString("es-CL")}</span>
          </div>
        </div>
      )}
    </div>
  );
}