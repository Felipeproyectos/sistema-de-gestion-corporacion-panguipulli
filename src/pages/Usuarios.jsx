import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Shield, User, Mail } from "lucide-react";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me();
      setUser(u);
      // Temporalmente todos tienen acceso
      // if (u?.role !== "admin") return;
      const list = await base44.entities.User.list();
      setUsuarios(list);
      setLoading(false);
    };
    init();
  }, []);

  const handleChangeRole = async (userId, newRole) => {
    await base44.entities.User.update(userId, { role: newRole });
    setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg("");
    await base44.users.inviteUser(inviteEmail.trim(), inviteRole);
    setInviteMsg(`Invitación enviada a ${inviteEmail}`);
    setInviteEmail("");
    setInviting(false);
  };

  // Temporalmente todos tienen acceso de admin
  // if (user?.role !== "admin") {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <div className="text-center text-slate-400">
  //         <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
  //         <p>Acceso restringido</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#e8f4fd" }}>
      {/* Header */}
      <div className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 40%, #29b6f6 100%)" }}>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full opacity-20 border-4 border-white" />
        <div className="absolute right-4 bottom-0 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #29b6f6 0%, transparent 70%)" }} />
        <div className="relative max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest">Administración</p>
            <h1 className="text-3xl font-bold text-white">Usuarios</h1>
            <p className="text-blue-100 text-sm mt-0.5">Gestión de accesos y roles</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-6 pb-10">
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6">

          {/* Invitar usuario */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Invitar Usuario
            </h2>
            <div className="flex gap-3 flex-wrap">
              <input
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white min-w-48"
                placeholder="correo@ejemplo.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
              <select
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "#1565c0" }}
              >
                {inviting ? "Enviando..." : "Invitar"}
              </button>
            </div>
            {inviteMsg && <p className="text-xs text-green-600 mt-2">{inviteMsg}</p>}
          </div>

          {/* Lista usuarios */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-white">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4" /> Usuarios registrados ({usuarios.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {usuarios.map(u => (
                <div key={u.id} className="px-6 py-4 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: u.role === "admin" ? "#1565c0" : "#64748b" }}>
                      {u.full_name?.charAt(0) || u.email?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.full_name || "—"}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${u.role === "admin" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                      {u.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {u.role === "admin" ? "Admin" : "Usuario"}
                    </span>
                    {u.id !== user?.id && (
                      <select
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50"
                        value={u.role || "user"}
                        onChange={e => handleChangeRole(u.id, e.target.value)}
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}