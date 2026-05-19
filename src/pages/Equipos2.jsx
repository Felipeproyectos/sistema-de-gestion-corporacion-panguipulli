import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Monitor, Plus, Search, Filter, ChevronRight, AlertTriangle, CheckCircle, Wrench, X, RefreshCw } from "lucide-react";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import { getCentrosEstructura, TIPOS_EQUIPO, ESTADOS_EQUIPO } from "@/lib/centros";
import EquipoCard from "@/components/equipos2/EquipoCard";
import EquipoFormModal from "@/components/equipos2/EquipoFormModal";
import EquipoDetalleModal from "@/components/equipos2/EquipoDetalleModal";

export default function Equipos2() {
  const [user, setUser] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [parches, setParches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [centroSeleccionado, setCentroSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [equipoEditar, setEquipoEditar] = useState(null);
  const [equipoDetalle, setEquipoDetalle] = useState(null);
  const containerRef = useRef(null);

  const reload = useCallback(async () => {
    const [eq, pa] = await Promise.all([
      base44.entities.Equipo.list(),
      base44.entities.Parche.list()
    ]);
    setEquipos(eq);
    setParches(pa);
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    reload().finally(() => setLoading(false));
  }, [reload]);

  const { refreshing } = usePullToRefresh(reload, containerRef);

  const isAdmin = user?.role === "admin";

  const centrosPermitidos = !isAdmin && user?.centros_asignados?.length > 0 ? user.centros_asignados : null;

  const [centrosEstructura, setCentrosEstructura] = useState([]);
  useEffect(() => { getCentrosEstructura().then(setCentrosEstructura); }, []);

  const centroSeleccionadoObj = centroSeleccionado
    ? centrosEstructura.find(c => c.nombre === centroSeleccionado)
    : null;
  const subsedesDelCentro = centroSeleccionadoObj?.subsedes || [];

  const equiposFiltrados = equipos.filter(e => {
    if (centrosPermitidos && !centrosPermitidos.includes(e.centro_principal)) return false;
    if (centroSeleccionado) {
      const enCentro = e.centro_principal === centroSeleccionado;
      const enSubsede = subsedesDelCentro.includes(e.subsede);
      if (!enCentro && !enSubsede) return false;
    }
    if (filtroEstado !== "todos" && e.estado !== filtroEstado) return false;
    if (filtroTipo !== "todos" && e.tipo !== filtroTipo) return false;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      return (e.numero_inventario || "").toLowerCase().includes(b) ||
        (e.marca || "").toLowerCase().includes(b) ||
        (e.modelo || "").toLowerCase().includes(b) ||
        (e.subsede || "").toLowerCase().includes(b);
    }
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen" style={{ background: "#e8f4fd", overscrollBehavior: "none" }}>
      {refreshing && (
        <div className="flex items-center justify-center py-3 lg:hidden">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      )}
      {/* Header */}
      <div className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 40%, #29b6f6 100%)" }}>
        <div className="relative max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest">Inventario</p>
              <h1 className="text-3xl font-bold text-white">Equipos Médicos</h1>
              <p className="text-blue-100 text-sm mt-0.5">
                {centroSeleccionado ? centroSeleccionado : "Todos los centros"}
                {" · "}{equiposFiltrados.length} equipo(s)
              </p>
            </div>
          </div>
          <button
            onClick={() => { setEquipoEditar(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold shadow"
            style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-6 pb-10">
        {/* Selector de centro (solo admin) */}
        {isAdmin && (
          <div className="bg-white rounded-2xl shadow p-5 mb-6">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-500" /> Seleccionar Centro Principal
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCentroSeleccionado(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${!centroSeleccionado ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}
              >
                Todos
              </button>
              {centrosEstructura.map(c => (
                <button
                  key={c.nombre}
                  onClick={() => setCentroSeleccionado(c.nombre)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${centroSeleccionado === c.nombre ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por inventario, marca, modelo..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="todos">Todos los estados</option>
            {ESTADOS_EQUIPO.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="todos">Todos los tipos</option>
            {TIPOS_EQUIPO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Grid de equipos */}
        {equiposFiltrados.length === 0 ? (
          <div className="text-center py-20 text-slate-400 bg-white rounded-2xl shadow">
            <Monitor className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No se encontraron equipos</p>
            <p className="text-sm mt-1">Intenta cambiar los filtros o agrega un nuevo equipo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {equiposFiltrados.map(equipo => (
              <EquipoCard
                key={equipo.id}
                equipo={equipo}
                parches={parches.filter(p => p.equipo_id === equipo.id && p.activo !== false)}
                onClick={() => setEquipoDetalle(equipo)}
                onEdit={() => { setEquipoEditar(equipo); setShowForm(true); }}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <EquipoFormModal
          equipo={equipoEditar}
          onClose={() => { setShowForm(false); setEquipoEditar(null); }}
          onSaved={() => { setShowForm(false); setEquipoEditar(null); reload(); }}
          user={user}
        />
      )}
      {equipoDetalle && (
        <EquipoDetalleModal
          equipo={equipoDetalle}
          parches={parches.filter(p => p.equipo_id === equipoDetalle.id)}
          onClose={() => setEquipoDetalle(null)}
          onEdit={() => { setEquipoEditar(equipoDetalle); setEquipoDetalle(null); setShowForm(true); }}
          onDeleted={() => { setEquipoDetalle(null); reload(); }}
          user={user}
          onActividadCreada={reload}
        />
      )}
    </div>
  );
}