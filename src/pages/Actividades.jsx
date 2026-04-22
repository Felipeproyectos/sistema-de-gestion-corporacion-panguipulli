import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, Search, Filter } from "lucide-react";
import { TIPOS_ACTIVIDAD, CENTROS_ESTRUCTURA } from "@/lib/centros";
import { format } from "date-fns";
import NativePicker from "@/components/NativePicker";

const TIPO_COLORS = {
  cambio_parches: { bg: "#eff6ff", text: "#1d4ed8" },
  mantenimiento_preventivo: { bg: "#f0fdf4", text: "#15803d" },
  mantenimiento_correctivo: { bg: "#fef9c3", text: "#854d0e" },
  error_calibracion: { bg: "#fef2f2", text: "#dc2626" },
  inspeccion: { bg: "#f5f3ff", text: "#7c3aed" },
  traslado: { bg: "#fff7ed", text: "#c2410c" }
};

export default function Actividades() {
  const [actividades, setActividades] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroCentro, setFiltroCentro] = useState("todos");

  useEffect(() => {
    Promise.all([
      base44.entities.Actividad.list("-fecha", 200),
      base44.entities.Equipo.list()
    ]).then(([acts, eqs]) => {
      setActividades(acts);
      setEquipos(eqs);
      setLoading(false);
    });
  }, []);

  const filtradas = actividades.filter(a => {
    const equipo = equipos.find(e => e.id === a.equipo_id);
    if (filtroTipo !== "todos" && a.tipo !== filtroTipo) return false;
    if (filtroCentro !== "todos" && equipo?.centro_principal !== filtroCentro) return false;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      return (a.observaciones || "").toLowerCase().includes(b) ||
        (a.usuario_nombre || "").toLowerCase().includes(b) ||
        (equipo?.marca || "").toLowerCase().includes(b) ||
        (equipo?.modelo || "").toLowerCase().includes(b);
    }
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#e8f4fd" }}>
      <div className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 40%, #29b6f6 100%)" }}>
        <div className="relative max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest">Registro</p>
            <h1 className="text-3xl font-bold text-white">Actividades</h1>
            <p className="text-blue-100 text-sm mt-0.5">{filtradas.length} actividad(es) registradas</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-6 pb-10">
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <NativePicker
            value={filtroTipo}
            onChange={setFiltroTipo}
            placeholder="Todos los tipos"
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 w-full lg:w-auto"
            options={[{ value: "todos", label: "Todos los tipos" }, ...TIPOS_ACTIVIDAD]}
          />
          <NativePicker
            value={filtroCentro}
            onChange={setFiltroCentro}
            placeholder="Todos los centros"
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 w-full lg:w-auto"
            options={[{ value: "todos", label: "Todos los centros" }, ...CENTROS_ESTRUCTURA.map(c => ({ value: c.nombre, label: c.nombre }))]}
          />
        </div>

        <div className="space-y-3">
          {filtradas.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow text-slate-400">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>No hay actividades para mostrar</p>
            </div>
          ) : filtradas.map(act => {
            const equipo = equipos.find(e => e.id === act.equipo_id);
            const tipo = TIPOS_ACTIVIDAD.find(t => t.value === act.tipo);
            const colors = TIPO_COLORS[act.tipo] || { bg: "#f8fafc", text: "#475569" };
            return (
              <div key={act.id} className="bg-white rounded-2xl shadow border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: colors.bg, color: colors.text }}>
                      {tipo?.label || act.tipo}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {equipo ? `${equipo.marca} ${equipo.modelo}` : "Equipo desconocido"}
                        {equipo?.numero_inventario && <span className="text-slate-400 font-normal text-xs"> #{equipo.numero_inventario}</span>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {equipo?.centro_principal}
                        {equipo?.subsede && ` › ${equipo.subsede}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">{act.fecha}</p>
                    {act.usuario_nombre && <p className="text-xs text-slate-400">{act.usuario_nombre}</p>}
                  </div>
                </div>
                {act.observaciones && (
                  <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2">{act.observaciones}</p>
                )}
                {act.tipo === "traslado" && act.centro_destino && (
                  <p className="mt-2 text-xs text-blue-600 font-medium">
                    Trasladado a: {act.centro_destino}{act.subsede_destino ? ` › ${act.subsede_destino}` : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}