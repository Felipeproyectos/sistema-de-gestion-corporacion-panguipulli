import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getCentrosEstructura } from "@/lib/centros";
import { Shield, Wrench, Stethoscope, User, ChevronDown, ChevronUp } from "lucide-react";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Administrador",
  monitor_corporativo: "Monitor Corp.",
  admin_salud: "Admin Salud",
  supervisor: "Supervisor",
  operador: "Operador",
  jefe_taller: "Jefe Taller",
  mecanico: "Mecánico",
  user: "Usuario",
};

const ROLE_COLORS = {
  super_admin: "#7c3aed",
  admin: "#2563EB",
  monitor_corporativo: "#0891b2",
  admin_salud: "#059669",
  supervisor: "#0d9488",
  operador: "#65a30d",
  jefe_taller: "#ea580c",
  mecanico: "#ca8a04",
  user: "#64748b",
};

function getCentros(u) {
  const arr = Array.isArray(u.centros_asignados) ? u.centros_asignados : [];
  const legacy = u.centro_asignado ? [u.centro_asignado] : [];
  const all = [...new Set([...arr, ...legacy])].filter(Boolean);
  return all;
}

export default function UsuarioCard({ usuario, currentUser, onUpdated }) {
  const [expandido, setExpandido] = useState(false);
  const [editando, setEditando] = useState(false);
  const [area, setArea] = useState(usuario.area || "salud");
  const [centros, setCentros] = useState(getCentros(usuario));
  const [guardando, setGuardando] = useState(false);
  const [centrosList, setCentrosList] = useState([]);
  const centrosActuales = getCentros(usuario);

  useEffect(() => {
    getCentrosEstructura().then(setCentrosList).catch(() => {});
  }, []);

  const isSelf = usuario.id === currentUser?.id;
  const canEdit = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const color = ROLE_COLORS[usuario.role] || "#64748b";
  const AreaIcon = usuario.area === "taller" || ["jefe_taller", "mecanico"].includes(usuario.role)
    ? Wrench
    : usuario.area === "admin" || ["admin", "super_admin", "monitor_corporativo"].includes(usuario.role)
    ? Shield
    : Stethoscope;

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const update = { area, centros_asignados: centros };
      await base44.entities.User.update(usuario.id, update);
      onUpdated?.(usuario.id, update);
      setEditando(false);
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  const toggleCentro = (nombre) => {
    setCentros(prev => prev.includes(nombre) ? prev.filter(c => c !== nombre) : [...prev, nombre]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: color }}>
            {usuario.full_name?.charAt(0) || usuario.email?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{usuario.full_name || "Sin nombre"}</p>
            <p className="text-xs text-slate-400 truncate">{usuario.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: `${color}15`, color }}>
            <AreaIcon className="w-3 h-3" />
            {ROLE_LABELS[usuario.role] || usuario.role || "Usuario"}
          </span>
          <button onClick={() => setExpandido(!expandido)} className="text-slate-400 hover:text-slate-600">
            {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expandido && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-50 space-y-3">
          {!editando ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400 uppercase font-semibold">Área</p>
                  <p className="text-slate-700 font-medium capitalize">{usuario.area || (centrosActuales.length > 0 ? "salud" : "—")}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase font-semibold">Centros</p>
                  <p className="text-slate-700 font-medium">{centrosActuales.length > 0 ? centrosActuales.join(", ") : "—"}</p>
                </div>
              </div>
              {canEdit && !isSelf && (
                <button
                  onClick={() => setEditando(true)}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  Editar asignación
                </button>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Área</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {["salud", "taller", "admin"].map(a => (
                    <button
                      key={a}
                      onClick={() => setArea(a)}
                      className="py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={area === a ? { background: "#1E293B", color: "white" } : { background: "#F1F5F9", color: "#64748B" }}
                    >
                      {a === "admin" ? "Admin" : a}
                    </button>
                  ))}
                </div>
              </div>
              {area === "salud" && (
                <div>
                  <label className="text-xs font-semibold text-slate-500">Centros asignados</label>
                  <p className="text-xs text-slate-400 mt-0.5">Selecciona uno o más</p>
                  <div className="mt-1 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-1.5 space-y-0.5">
                    {centrosList.map(c => (
                      <label key={c.nombre} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={centros.includes(c.nombre)} onChange={() => toggleCentro(c.nombre)} className="w-3.5 h-3.5" />
                        <span className="text-xs text-slate-700">{c.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setEditando(false)} className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100">
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                  style={{ background: "#2563EB" }}
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}