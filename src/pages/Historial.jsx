import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { History, Search, Loader2, Plus, Edit2, Trash2, Filter } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const ACCION_CONFIG = {
  crear:   { color: "bg-green-100 text-green-700 border-green-200",  icon: Plus,  label: "Creó" },
  editar:  { color: "bg-blue-100 text-blue-700 border-blue-200",    icon: Edit2, label: "Editó" },
  eliminar:{ color: "bg-red-100 text-red-700 border-red-200",       icon: Trash2,label: "Eliminó" },
};

export default function Historial() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroAccion, setFiltroAccion] = useState("todos");

  useEffect(() => {
    base44.entities.Historial.list("-created_date", 200)
      .then(data => { setRegistros(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtrados = registros.filter(r => {
    const matchAccion = filtroAccion === "todos" || r.accion === filtroAccion;
    const matchSearch = !search || 
      r.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
      r.usuario_email?.toLowerCase().includes(search.toLowerCase()) ||
      r.usuario_nombre?.toLowerCase().includes(search.toLowerCase());
    return matchAccion && matchSearch;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#1565c0,#0288d1)" }}>
            <History className="w-5 h-5 text-white" />
          </div>
          Historial de Actividad
        </h1>
        <p className="text-slate-500 mt-1">Registro de todas las acciones realizadas en la plataforma</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white shadow-sm"
            placeholder="Buscar por usuario o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          {["todos", "crear", "editar", "eliminar"].map(a => (
            <button
              key={a}
              onClick={() => setFiltroAccion(a)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
                filtroAccion === a
                  ? "text-white shadow-sm"
                  : "bg-white text-slate-500 border border-slate-200"
              }`}
              style={filtroAccion === a ? { background: "linear-gradient(135deg,#1565c0,#0288d1)" } : {}}
            >
              {a === "todos" ? "Todos" : a}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Creaciones", key: "crear", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Ediciones", key: "editar", color: "#1565c0", bg: "#eff6ff" },
          { label: "Eliminaciones", key: "eliminar", color: "#dc2626", bg: "#fef2f2" },
        ].map(s => (
          <div key={s.key} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {registros.filter(r => r.accion === s.key).length}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filtrados.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay registros de actividad aún</p>
            <p className="text-xs mt-1">Las acciones se registrarán automáticamente</p>
          </div>
        )}
        {filtrados.map(r => {
          const cfg = ACCION_CONFIG[r.accion] || ACCION_CONFIG.editar;
          const Icon = cfg.icon;
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 leading-snug">{r.descripcion}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-slate-500">
                    {r.usuario_nombre ? `${r.usuario_nombre}` : r.usuario_email}
                  </span>
                  {r.usuario_nombre && (
                    <span className="text-xs text-slate-300">{r.usuario_email}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                  {cfg.label}
                </span>
                {r.created_date && (
                  <span className="text-xs text-slate-400">
                    {format(new Date(r.created_date), "dd/MM/yy HH:mm")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}