import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Save, Settings, Users, Shield, Mail, UserPlus, Trash2, Edit2, X, Check } from "lucide-react";

export default function Configuracion() {
  const [user, setUser]     = useState(null);
  const [config, setConfig] = useState(null);
  const [form, setForm]     = useState({ nombre_app: "", subtitulo: "", logo_url: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const [usuarios, setUsuarios] = useState([]);
  const [invEmail, setInvEmail] = useState("");
  const [invRole, setInvRole]   = useState("user");
  const [invitando, setInvitando] = useState(false);
  const [invMsg, setInvMsg]     = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [centros, setCentros]   = useState([]);

  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me().catch(() => null);
      setUser(u);
      if (u?.role !== "admin") return;
      const [configs, usrs] = await Promise.all([
        base44.entities.AppConfig.list(),
        base44.entities.User.list().catch(() => [])
      ]);
      if (configs.length > 0) {
        setConfig(configs[0]);
        setForm({ nombre_app: configs[0].nombre_app || "", subtitulo: configs[0].subtitulo || "", logo_url: configs[0].logo_url || "" });
      }
      setUsuarios(usrs);
      // Centros desde estructura fija
      const { CENTROS_ESTRUCTURA } = await import("@/lib/centros");
      setCentros(CENTROS_ESTRUCTURA.map(c => c.nombre));
    };
    init();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("logo_url", file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (config?.id) {
      await base44.entities.AppConfig.update(config.id, form);
    } else {
      const newConfig = await base44.entities.AppConfig.create(form);
      setConfig(newConfig);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleInvitar = async () => {
    if (!invEmail.includes("@")) return;
    setInvitando(true);
    setInvMsg("");
    try {
      await base44.users.inviteUser(invEmail, invRole);
      setInvMsg("✅ Invitación enviada correctamente");
      setInvEmail("");
      const updated = await base44.entities.User.list().catch(() => []);
      setUsuarios(updated);
    } catch {
      setInvMsg("❌ No se pudo enviar la invitación");
    }
    setInvitando(false);
  };

  const handleUpdateUser = async (userId, data) => {
    await base44.entities.User.update(userId, data);
    setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    setEditingUser(null);
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (user?.role !== "admin") return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-slate-400">
      <Shield className="w-16 h-16 opacity-20" />
      <p className="text-lg font-medium">Acceso restringido a administradores</p>
    </div>
  );

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-slate-50";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="min-h-screen" style={{ background: "#e8f4fd" }}>
      <div className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 40%, #29b6f6 100%)" }}>
        <div className="relative max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest">Administración</p>
            <h1 className="text-3xl font-bold text-white">Configuración</h1>
            <p className="text-blue-100 text-sm mt-0.5">Gestión del sistema y usuarios</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-6 pb-10 space-y-6">

        {/* Personalización */}
        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-6">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" /> Personalización del Sistema
          </h2>

          <div className="flex items-center gap-4 p-5 rounded-xl bg-slate-800">
            <div className="flex items-center justify-center overflow-hidden flex-shrink-0" style={form.logo_url ? { width: 52, height: 52 } : { width: 44, height: 44, background: "#2563eb", borderRadius: 12 }}>
              {form.logo_url ? <img src={form.logo_url} alt="logo" className="w-full h-full object-contain" /> : <Settings className="w-6 h-6 text-white" />}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{form.nombre_app || "Sistema de Gestión de Equipos"}</p>
              <p className="text-white/40 text-xs mt-0.5">{form.subtitulo || "Subtítulo"}</p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Logo institucional</label>
            <div className="flex items-center gap-4">
              {form.logo_url && <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200"><img src={form.logo_url} alt="logo" className="w-full h-full object-cover" /></div>}
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors bg-slate-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Subiendo..." : "Subir imagen"}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              {form.logo_url && <button onClick={() => set("logo_url", "")} className="text-xs text-slate-400 hover:text-red-500">Eliminar</button>}
            </div>
          </div>
          <div>
            <label className={labelCls}>Nombre del sistema</label>
            <input className={inputCls} value={form.nombre_app} onChange={e => set("nombre_app", e.target.value)} placeholder="Sistema de Gestión de Equipos" />
          </div>
          <div>
            <label className={labelCls}>Subtítulo</label>
            <input className={inputCls} value={form.subtitulo} onChange={e => set("subtitulo", e.target.value)} placeholder="Corporación Municipal Panguipulli" />
          </div>
          <button onClick={handleSave} disabled={saving || uploading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: saved ? "#10b981" : "#2563eb" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "¡Guardado!" : "Guardar cambios"}
          </button>
        </div>

        {/* Gestión de usuarios */}
        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-5">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" /> Administración de Usuarios
          </h2>

          {/* Invitar */}
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" /> Invitar nuevo usuario</p>
            <div className="flex gap-2 flex-wrap">
              <input type="email" className="flex-1 min-w-48 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" placeholder="correo@ejemplo.cl" value={invEmail} onChange={e => setInvEmail(e.target.value)} />
              <select className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" value={invRole} onChange={e => setInvRole(e.target.value)}>
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
              <button onClick={handleInvitar} disabled={invitando || !invEmail} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: "#2563eb" }}>
                {invitando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Invitar
              </button>
            </div>
            {invMsg && <p className={`mt-2 text-xs ${invMsg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{invMsg}</p>}
          </div>

          {/* Lista usuarios */}
          <div className="space-y-2">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50">
                {editingUser?.id === u.id ? (
                  <div className="flex-1 flex items-center gap-3 flex-wrap">
                    <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" value={editingUser.role} onChange={e => setEditingUser(prev => ({...prev, role: e.target.value}))}>
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <select className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs flex-1 min-w-32" value={editingUser.centro_asignado || ""} onChange={e => setEditingUser(prev => ({...prev, centro_asignado: e.target.value}))}>
                      <option value="">Sin centro asignado</option>
                      {centros.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={() => handleUpdateUser(u.id, { role: editingUser.role, centro_asignado: editingUser.centro_asignado })} className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{u.full_name || u.email}</p>
                      <p className="text-xs text-slate-400">{u.email} · <span className={u.role === "admin" ? "text-blue-600 font-medium" : "text-slate-500"}>{u.role === "admin" ? "Administrador" : "Usuario"}</span>{u.centro_asignado ? ` · ${u.centro_asignado}` : ""}</p>
                    </div>
                    <button onClick={() => setEditingUser({ ...u })} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {usuarios.length === 0 && <p className="text-center text-sm text-slate-400 py-6">No hay usuarios registrados</p>}
          </div>
        </div>
      </div>
    </div>
  );
}