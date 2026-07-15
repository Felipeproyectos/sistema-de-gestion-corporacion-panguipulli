import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Building2, ShoppingCart, FileText, TrendingUp } from "lucide-react";

const ESTADO_CFG = {
  borrador: { color: "#64748B", bg: "#F1F5F9", label: "Borrador" },
  emitida: { color: "#2563EB", bg: "#EFF6FF", label: "Emitida" },
  recibida: { color: "#16A34A", bg: "#F0FDF4", label: "Recibida" },
  cancelada: { color: "#DC2626", bg: "#FEF2F2", label: "Cancelada" },
};

export default function ProveedorHistorialModal({ open, onClose, proveedor }) {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !proveedor) return;
    setLoading(true);
    base44.entities.OrdenDeCompra.filter({ proveedor_id: proveedor.id }, "-created_date", 200)
      .then((data) => setOrdenes(data || []))
      .catch(() => setOrdenes([]))
      .finally(() => setLoading(false));
  }, [open, proveedor]);

  if (!open || !proveedor) return null;

  const totalComprado = ordenes
    .filter(o => o.estado !== "cancelada")
    .reduce((s, o) => s + (o.total || 0), 0);
  const ordenesValidas = ordenes.filter(o => o.estado !== "cancelada");

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-white w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingCart className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold text-slate-800 text-sm truncate">Historial de Compras</h2>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {proveedor.nombre}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{ordenes.length}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Órdenes</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{ordenesValidas.length}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Vigentes</p>
            </div>
            <div className="bg-violet-50 rounded-2xl p-3 text-center">
              <p className="text-lg font-bold text-violet-600">${totalComprado.toLocaleString("es-CL")}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Total Comprado</p>
            </div>
          </div>

          {/* Lista de órdenes */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Cargando historial...</div>
          ) : ordenes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Este proveedor aún no tiene compras registradas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ordenes.map((o) => {
                const cfg = ESTADO_CFG[o.estado] || ESTADO_CFG.emitida;
                return (
                  <div key={o.id} className="border border-slate-200 rounded-2xl p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-slate-800 text-sm">{o.numero_oc || "Sin N°"}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {o.fecha_emision ? `Emitida: ${new Date(o.fecha_emision).toLocaleDateString("es-CL")}` : "Sin fecha"}
                          {o.fecha_entrega_estimada ? ` · Entrega: ${new Date(o.fecha_entrega_estimada).toLocaleDateString("es-CL")}` : ""}
                        </p>
                      </div>
                      <p className="font-bold text-slate-800 text-sm flex-shrink-0">
                        ${(o.total || 0).toLocaleString("es-CL")}
                      </p>
                    </div>
                    {Array.isArray(o.items) && o.items.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1">
                        {o.items.map((it, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-slate-500">
                            <span className="truncate flex-1">{it.repuesto_nombre || "Ítem"} × {it.cantidad || 0}</span>
                            <span className="flex-shrink-0 ml-2">${(it.subtotal || 0).toLocaleString("es-CL")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {o.notas && <p className="text-xs text-slate-400 mt-2 italic">{o.notas}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-600">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}