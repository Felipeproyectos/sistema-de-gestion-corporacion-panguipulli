import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, FileText, Edit2, Users, Trash2 } from "lucide-react";
import ParchesPanel from "./ParchesPanel";

export default function EquipoDetalle({ equipo, onClose, onEdit, onDelete, isAdmin }) {
  const [parches, setParches] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  const loadParches = async () => {
    const all = await base44.entities.Parche.list();
    setParches(all.filter(p => p.equipo_id === equipo.id));
  };

  useEffect(() => {
    loadParches();
    if (isAdmin) {
      base44.entities.User.list().then(setUsuarios);
    }
  }, [equipo.id]);

  const handleAddUser = async () => {
    if (!newEmail.trim()) return;
    setSavingUser(true);
    const assigned = [...(equipo.usuarios_asignados || [])];
    if (!assigned.includes(newEmail.trim())) {
      assigned.push(newEmail.trim());
      await base44.entities.EquipoDEA.update(equipo.id, { usuarios_asignados: assigned });
      equipo.usuarios_asignados = assigned;
    }
    setNewEmail("");
    setSavingUser(false);
  };

  const handleRemoveUser = async (email) => {
    const assigned = (equipo.usuarios_asignados || []).filter(e => e !== email);
    await base44.entities.EquipoDEA.update(equipo.id, { usuarios_asignados: assigned });
    equipo.usuarios_asignados = assigned;
  };

  const estadoColor = {
    operativo: "bg-green-50 text-green-700",
    mantenimiento: "bg-amber-50 text-amber-700",
    fuera_de_servicio: "bg-red-50 text-red-700"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-7 pt-7 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-900">{equipo.marca} {equipo.modelo}</h2>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${estadoColor[equipo.estado]}`}>
                {equipo.estado?.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-slate-500">S/N: {equipo.numero_serie}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button onClick={onEdit} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(equipo.id)} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-7 py-6 space-y-6">
          {/* Info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {[
              ["Establecimiento", equipo.establecimiento],
              ["Lugar", equipo.lugar_destinado],
              ["Año Adquisición", equipo.anio_adquisicion],
              ["Valor", equipo.valor ? `$${Number(equipo.valor).toLocaleString()}` : "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-slate-400">{k}</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{v || "—"}</p>
              </div>
            ))}
          </div>

          {/* Documento */}
          {equipo.orden_compra_url && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4">
              <FileText className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Orden de Compra / Factura</p>
              </div>
              <a href={equipo.orden_compra_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline">Ver PDF</a>
            </div>
          )}

          {/* Notas */}
          {equipo.notas && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Notas</p>
              <p className="text-sm text-slate-700">{equipo.notas}</p>
            </div>
          )}

          {/* Parches */}
          <div className="border-t border-slate-100 pt-6">
            <ParchesPanel
              equipoId={equipo.id}
              parches={parches}
              onRefresh={loadParches}
              isAdmin={isAdmin}
            />
          </div>

          {/* Usuarios asignados (solo admin) */}
          {isAdmin && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <Users className="w-4 h-4" /> Usuarios con Acceso
              </h3>
              <div className="flex gap-2 mb-3">
                <input
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-slate-50"
                  placeholder="email@ejemplo.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddUser()}
                />
                <button onClick={handleAddUser} disabled={savingUser} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#e63946" }}>
                  Agregar
                </button>
              </div>
              <div className="space-y-2">
                {(equipo.usuarios_asignados || []).map(email => (
                  <div key={email} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-700">{email}</span>
                    <button onClick={() => handleRemoveUser(email)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!equipo.usuarios_asignados || equipo.usuarios_asignados.length === 0) && (
                  <p className="text-sm text-slate-400 text-center py-2">Sin usuarios asignados</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}