import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Monitor, FileText } from "lucide-react";
import EquipoForm from "@/components/equipos/EquipoForm";
import EquipoDetalle from "@/components/equipos/EquipoDetalle";

export default function Equipos() {
  const [user, setUser] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editEquipo, setEditEquipo] = useState(null);
  const [selectedEquipo, setSelectedEquipo] = useState(null);

  const load = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const all = await base44.entities.EquipoDEA.list();
    const filtrados = u?.role === "admin"
      ? all
      : all.filter(e => e.usuarios_asignados?.includes(u.email));
    setEquipos(filtrados);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isAdmin = user?.role === "admin";

  const filtered = equipos.filter(e =>
    [e.marca, e.modelo, e.numero_serie, e.establecimiento, e.lugar_destinado]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const estadoColor = {
    operativo: "bg-green-100 text-green-700",
    mantenimiento: "bg-amber-100 text-amber-700",
    fuera_de_servicio: "bg-red-100 text-red-700"
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este equipo?")) return;
    await base44.entities.EquipoDEA.delete(id);
    setSelectedEquipo(null);
    load();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Equipos DEA</h1>
          <p className="text-slate-500 mt-1">{filtered.length} equipo{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditEquipo(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90"
            style={{ background: "#e63946" }}
          >
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white shadow-sm"
          placeholder="Buscar por marca, modelo, serie, establecimiento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(e => (
          <div
            key={e.id}
            onClick={() => setSelectedEquipo(e)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#fff1f2" }}>
                <Monitor className="w-5 h-5" style={{ color: "#e63946" }} />
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${estadoColor[e.estado]}`}>
                {e.estado?.replace("_", " ")}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">{e.marca} {e.modelo}</h3>
            <p className="text-xs text-slate-400 mt-0.5">S/N: {e.numero_serie}</p>
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
              <p className="text-xs text-slate-600"><span className="text-slate-400">Establecimiento:</span> {e.establecimiento}</p>
              <p className="text-xs text-slate-600"><span className="text-slate-400">Lugar:</span> {e.lugar_destinado || "—"}</p>
              {e.valor && (
                <p className="text-xs text-slate-600"><span className="text-slate-400">Valor:</span> ${Number(e.valor).toLocaleString()}</p>
              )}
            </div>
            {e.orden_compra_url && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-500">
                <FileText className="w-3.5 h-3.5" /> Documento adjunto
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <Monitor className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No se encontraron equipos</p>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <EquipoForm
          equipo={editEquipo}
          onClose={() => { setShowForm(false); setEditEquipo(null); }}
          onSaved={() => { setShowForm(false); setEditEquipo(null); load(); }}
        />
      )}

      {/* Modal Detalle */}
      {selectedEquipo && (
        <EquipoDetalle
          equipo={selectedEquipo}
          isAdmin={isAdmin}
          onClose={() => setSelectedEquipo(null)}
          onEdit={() => { setEditEquipo(selectedEquipo); setShowForm(true); setSelectedEquipo(null); }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}