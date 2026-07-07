import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getCentrosEstructura } from "@/lib/centros";
import { X, Mail, Loader2 } from "lucide-react";

const ROLES_SALUD = [
  { value: "user", label: "Operador / Usuario" },
  { value: "supervisor", label: "Supervisor" },
  { value: "admin_salud", label: "Admin Salud" },
];
const ROLES_TALLER = [
  { value: "mecanico", label: "Mecánico" },
  { value: "jefe_taller", label: "Jefe de Taller" },
];
const ROLES_ADMIN = [
  { value: "admin", label: "Administrador" },
  { value: "super_admin", label: "Super Administrador" },
  { value: "monitor_corporativo", label: "Monitor Corporativo" },
];

export default function InviteUserModal({ open, onClose, onInvited }) {
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("salud");
  const [role, setRole] = useState("user");
  const [centrosList, setCentrosList] = useState([]);
  const [centroSel, setCentroSel] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) getCentrosEstructura().then(setCentrosList).catch(() => {});
  }, [open]);

  useEffect(() => {
    // Reset role when area changes to a valid default
    if (area === "salud") setRole("user");
    if (area === "taller") setRole("mecanico");
    if (area === "admin") setRole("admin");
    setCentroSel([]);
  }, [area]);

  if (!open) return null;

  const rolesDisponibles =
    area === "salud" ? ROLES_SALUD :
    area === "taller" ? ROLES_TALLER :
    ROLES_ADMIN;

  const toggleCentro = (nombre) => {
    setCentroSel(prev =>
      prev.includes(nombre) ? prev.filter(c => c !== nombre) : [...prev, nombre]
    );
  };

  const puedeInvitar = email.trim() && area &&
    (area !== "salud" || centroSel.length > 0);

  const handleInvite = async () => {
    setError("");
    setMsg("");
    if (!email.trim()) { setError("Ingresa un correo válido"); return; }
    if (area === "salud" && centroSel.length === 0) {
      setError("Debes asignar al menos un centro para usuarios de Salud"); return;
    }
    setEnviando(true);
    try {
      await base44.users.inviteUser(email.trim(), role);
      // Guardar metadatos extra vía updateMe no aplica (el usuario aún no existe).
      // Los metadatos se asignarán cuando el usuario acepte y el super_admin los edite,
      // o guardamos en una lista pendiente. Por ahora solo invitamos con el rol.
      setMsg(`Invitación enviada a ${email.trim()} (${role}). Asigna el área/centro desde la lista tras que acepte.`);
      setEmail("");
      setCentroSel([]);
      if (onInvited) onInvited();
    } catch (e) {
      setError(e?.message || "Error al invitar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" /> Invitar Usuario
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Área */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Área</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {[
                { v: "salud", l: "Salud" },
                { v: "taller", l: "Taller" },
                { v: "admin", l: "Administración" },
              ].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setArea(opt.v)}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={area === opt.v
                    ? { background: "#1E293B", color: "white" }
                    : { background: "#F1F5F9", color: "#64748B" }}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Rol */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              {rolesDisponibles.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Centros (solo salud) */}
          {area === "salud" && (
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Centro(s) asignado(s) <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                {centrosList.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">Cargando centros...</p>
                )}
                {centrosList.map(c => (
                  <label key={c.nombre} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={centroSel.includes(c.nombre)}
                      onChange={() => toggleCentro(c.nombre)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-slate-700">{c.nombre}</span>
                    {c.subsedes?.length > 0 && (
                      <span className="text-xs text-slate-400">({c.subsedes.length} subsedes)</span>
                    )}
                  </label>
                ))}
              </div>
              {centroSel.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">Seleccionados: {centroSel.join(", ")}</p>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {msg && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{msg}</p>}
        </div>

        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100">
            Cerrar
          </button>
          <button
            onClick={handleInvite}
            disabled={!puedeInvitar || enviando}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#2563EB" }}
          >
            {enviando ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Invitar"}
          </button>
        </div>
      </div>
    </div>
  );
}