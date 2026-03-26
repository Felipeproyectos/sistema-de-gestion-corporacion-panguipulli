import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Save, Settings } from "lucide-react";
import ManualAlertasAutomaticas from "@/components/ManualAlertasAutomaticas";
import ConfigEmailAlertas from "@/components/ConfigEmailAlertas";

export default function Configuracion() {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({ nombre_app: "", subtitulo: "", logo_url: "" });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me();
      setUser(u);
      const configs = await base44.entities.AppConfig.list();
      if (configs.length > 0) {
        setConfig(configs[0]);
        setForm({ nombre_app: configs[0].nombre_app || "", subtitulo: configs[0].subtitulo || "", logo_url: configs[0].logo_url || "" });
      }
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

  // Temporalmente todos tienen acceso de admin
  // if (user?.role !== "admin") {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <p className="text-slate-400">Acceso restringido a administradores</p>
  //     </div>
  //   );
  // }

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-slate-50";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="min-h-screen" style={{ background: "#e8f4fd" }}>
      {/* Header */}
      <div className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-20" style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 40%, #29b6f6 100%)" }}>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full opacity-20 border-4 border-white" />
        <div className="absolute right-4 bottom-0 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #29b6f6 0%, transparent 70%)" }} />
        <div className="relative max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest">Sistema</p>
            <h1 className="text-3xl font-bold text-white">Configuración</h1>
            <p className="text-blue-100 text-sm mt-0.5">Personaliza el nombre y logo de la aplicación</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 lg:px-10 -mt-10 pb-10">

      <div className="bg-white rounded-3xl shadow-lg p-8 space-y-6">
        {/* Preview */}
        <div className="flex items-center gap-4 p-5 rounded-xl bg-slate-800">
          <div className="flex items-center justify-center overflow-hidden flex-shrink-0" style={form.logo_url ? { width: 52, height: 52 } : { width: 44, height: 44, background: "#e63946", borderRadius: 12 }}>
            {form.logo_url
              ? <img src={form.logo_url} alt="logo" className="w-full h-full object-contain" />
              : <Settings className="w-6 h-6 text-white" />
            }
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">{form.nombre_app || "Nombre de la app"}</p>
            <p className="text-white/40 text-xs mt-0.5">{form.subtitulo || "Subtítulo"}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 -mt-2 text-center">Vista previa en el menú lateral</p>

        {/* Logo */}
        <div>
          <label className={labelCls}>Logo</label>
          <div className="flex items-center gap-4">
            {form.logo_url && (
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                <img src={form.logo_url} alt="logo" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-500 hover:border-red-400 hover:text-red-500 transition-colors bg-slate-50">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Subiendo..." : "Subir imagen"}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
            {form.logo_url && (
              <button onClick={() => set("logo_url", "")} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                Eliminar
              </button>
            )}
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className={labelCls}>Nombre de la aplicación</label>
          <input className={inputCls} value={form.nombre_app} onChange={e => set("nombre_app", e.target.value)} placeholder="Ej: DEA Manager" />
        </div>

        {/* Subtítulo */}
        <div>
          <label className={labelCls}>Subtítulo</label>
          <input className={inputCls} value={form.subtitulo} onChange={e => set("subtitulo", e.target.value)} placeholder="Ej: Sistema de gestión" />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ background: saved ? "#10b981" : "#e63946" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? "¡Guardado!" : "Guardar cambios"}
        </button>
      </div>

      {/* Correos por CESFAM */}
      <div className="mt-6">
        <ConfigEmailAlertas />
      </div>

      {/* Sistema de Alertas Automáticas */}
      <div className="mt-6">
        <ManualAlertasAutomaticas />
      </div>
      </div>
    </div>
  );
}