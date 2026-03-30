import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle, Bell, Plus, X, Loader2, Mail, Send } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { CENTROS_ESTRUCTURA } from "@/lib/centros";

const NIVEL_CONFIG = {
  critica:    { color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", label: "Crítica" },
  advertencia:{ color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Advertencia" },
  info:       { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "Info" }
};

const TIPOS_ALERTA = [
  { value: "mantenimiento_requerido", label: "Mantenimiento Requerido" },
  { value: "equipo_fuera_servicio",   label: "Equipo Fuera de Servicio" },
  { value: "parche_vencido",          label: "Parche Vencido" },
  { value: "parche_por_vencer",       label: "Parche por Vencer" },
  { value: "bateria_vencida",         label: "Batería Vencida" },
  { value: "bateria_por_vencer",      label: "Batería por Vencer" },
];

export default function AlertasV2() {
  const [user, setUser]       = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [parches, setParches] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro]   = useState("activa");
  const [showModal, setShowModal] = useState(false);
  const [enviando, setEnviando]   = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    tipo: "mantenimiento_requerido",
    nivel: "advertencia",
    descripcion: "",
    equipo_id: "",
    centro: "",
    destinatarios: []
  });

  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me().catch(() => null);
      setUser(u);
      const [eqs, pa, al, usrs] = await Promise.all([
        base44.entities.Equipo.list(),
        base44.entities.Parche.list(),
        base44.entities.Alerta.list(),
        base44.entities.User.list().catch(() => [])
      ]);
      setEquipos(eqs);
      setParches(pa);
      setUsuarios(usrs);
      await generarAlertasAutomaticas(eqs, pa, al);
      const alFinal = await base44.entities.Alerta.list();
      setAlertas(alFinal);
      setLoading(false);
    };
    init();
  }, []);

  const generarAlertasAutomaticas = async (eqs, pa, alertasExistentes) => {
    const hoy = new Date();
    const nuevas = [];
    for (const eq of eqs) {
      const parchesEq = pa.filter(p => p.equipo_id === eq.id && p.activo !== false);
      for (const parche of parchesEq) {
        if (!parche.fecha_vencimiento) continue;
        const dias = differenceInDays(parseISO(parche.fecha_vencimiento), hoy);
        const tipo = dias < 0 ? "parche_vencido" : dias <= 90 ? "parche_por_vencer" : null;
        if (!tipo) continue;
        const yaExiste = alertasExistentes.some(a => a.equipo_id === eq.id && a.tipo === tipo && a.estado === "activa");
        if (!yaExiste) nuevas.push({ equipo_id: eq.id, tipo, nivel: dias < 0 ? "critica" : "advertencia", descripcion: `Parche ${parche.tipo} ${dias < 0 ? "vencido" : `vence en ${dias} días`}`, estado: "activa", centro: eq.centro_principal, subsede: eq.subsede || "" });
      }
      if (eq.fecha_vencimiento_bateria) {
        const dias = differenceInDays(parseISO(eq.fecha_vencimiento_bateria), hoy);
        const tipo = dias < 0 ? "bateria_vencida" : dias <= 90 ? "bateria_por_vencer" : null;
        if (tipo && !alertasExistentes.some(a => a.equipo_id === eq.id && a.tipo === tipo && a.estado === "activa")) {
          nuevas.push({ equipo_id: eq.id, tipo, nivel: dias < 0 ? "critica" : "advertencia", descripcion: `Batería ${dias < 0 ? "vencida" : `vence en ${dias} días`}`, estado: "activa", centro: eq.centro_principal, subsede: eq.subsede || "" });
        }
      }
    }
    for (const a of nuevas) await base44.entities.Alerta.create(a);
  };

  const handleResolver = async (alerta) => {
    await base44.entities.Alerta.update(alerta.id, { estado: "resuelta", fecha_resolucion: new Date().toISOString().split("T")[0] });
    setAlertas(prev => prev.map(a => a.id === alerta.id ? { ...a, estado: "resuelta" } : a));
  };

  const handleCrearAlerta = async () => {
    if (!form.tipo || !form.descripcion) return;
    setGuardando(true);
    const equipo = equipos.find(e => e.id === form.equipo_id);
    const nuevaAlerta = await base44.entities.Alerta.create({
      tipo: form.tipo,
      nivel: form.nivel,
      descripcion: form.descripcion,
      equipo_id: form.equipo_id || null,
      centro: equipo?.centro_principal || form.centro,
      subsede: equipo?.subsede || "",
      estado: "activa"
    });

    // Enviar emails a destinatarios seleccionados
    if (form.destinatarios.length > 0) {
      setEnviando(true);
      const equipoLabel = equipo ? `${equipo.marca} ${equipo.modelo}` : "Sistema";
      const body = `<h2 style="color:#1565c0">⚠️ Alerta: ${TIPOS_ALERTA.find(t=>t.value===form.tipo)?.label}</h2>
<p><strong>Equipo:</strong> ${equipoLabel}</p>
<p><strong>Descripción:</strong> ${form.descripcion}</p>
<p><strong>Nivel:</strong> ${NIVEL_CONFIG[form.nivel]?.label}</p>
<br/><p style="color:#666;font-size:12px">Sistema de Gestión de Equipos – Corporación Municipal Panguipulli</p>`;
      for (const email of form.destinatarios) {
        await base44.integrations.Core.SendEmail({ to: email, subject: `[Alerta] ${TIPOS_ALERTA.find(t=>t.value===form.tipo)?.label}`, body }).catch(() => {});
      }
      setEnviando(false);
    }

    setAlertas(prev => [nuevaAlerta, ...prev]);
    setForm({ tipo: "mantenimiento_requerido", nivel: "advertencia", descripcion: "", equipo_id: "", centro: "", destinatarios: [] });
    setShowModal(false);
    setGuardando(false);
  };

  const toggleDestinatario = (email) => {
    setForm(f => ({
      ...f,
      destinatarios: f.destinatarios.includes(email) ? f.destinatarios.filter(e => e !== email) : [...f.destinatarios, email]
    }));
  };

  const isAdmin = user?.role === "admin";
  const filtradas = alertas.filter(a => filtro === "todos" ? true : a.estado === filtro)
    .sort((a, b) => ({ critica: 0, advertencia: 1, info: 2 }[a.nivel] || 1) - ({ critica: 0, advertencia: 1, info: 2 }[b.nivel] || 1));
  const counts = { activa: alertas.filter(a => a.estado === "activa").length, resuelta: alertas.filter(a => a.estado === "resuelta").length, critica: alertas.filter(a => a.estado === "activa" && a.nivel === "critica").length };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen" style={{ background: "#e8f4fd" }}>
      <div className="relative overflow-hidden px-6 lg:px-10 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 40%, #29b6f6 100%)" }}>
        <div className="relative max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest">Sistema</p>
              <h1 className="text-3xl font-bold text-white">Alertas</h1>
              <p className="text-blue-100 text-sm mt-0.5">{counts.critica} crítica(s) activa(s)</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white border border-white/30" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Plus className="w-4 h-4" /> Crear Alerta
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-6 pb-10">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[{ label: "Activas", count: counts.activa, color: "#dc2626" }, { label: "Críticas", count: counts.critica, color: "#ea580c" }, { label: "Resueltas", count: counts.resuelta, color: "#16a34a" }].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow border border-slate-100">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-5">
          {[{ key: "activa", label: "Activas", count: counts.activa }, { key: "resuelta", label: "Resueltas", count: counts.resuelta }, { key: "todos", label: "Todas" }].map(t => (
            <button key={t.key} onClick={() => setFiltro(t.key)} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${filtro === t.key ? "text-white" : "bg-white text-slate-500 border border-slate-200"}`} style={filtro === t.key ? { background: "#1a2e4a" } : {}}>
              {t.label}{t.count !== undefined ? ` (${t.count})` : ""}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtradas.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No hay alertas en esta categoría</p>
            </div>
          ) : filtradas.map(alerta => {
            const equipo = equipos.find(e => e.id === alerta.equipo_id);
            const cfg = NIVEL_CONFIG[alerta.nivel] || NIVEL_CONFIG.advertencia;
            return (
              <div key={alerta.id} className="bg-white rounded-2xl shadow border p-5 flex items-center justify-between gap-3" style={{ borderColor: cfg.border }}>
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>{TIPOS_ALERTA.find(t=>t.value===alerta.tipo)?.label || alerta.tipo}</span>
                      <span className="text-xs text-slate-400">{cfg.label}</span>
                    </div>
                    <p className="font-semibold text-slate-900 text-sm">{equipo ? `${equipo.marca} ${equipo.modelo}` : "Sin equipo asociado"}</p>
                    <p className="text-xs text-slate-500">{alerta.descripcion}</p>
                    <p className="text-xs text-slate-400">{alerta.centro}{alerta.subsede ? ` › ${alerta.subsede}` : ""}</p>
                  </div>
                </div>
                {alerta.estado === "activa" && isAdmin ? (
                  <button onClick={() => handleResolver(alerta)} className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "#16a34a" }}>Resolver</button>
                ) : alerta.estado === "resuelta" ? (
                  <span className="flex-shrink-0 flex items-center gap-1.5 text-xs text-green-600 font-medium px-3 py-2 bg-green-50 rounded-xl"><CheckCircle className="w-3.5 h-3.5" /> Resuelta</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Crear Alerta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-7 pt-7 pb-4 border-b border-slate-100 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #1a2e4a, #1565c0)", borderRadius: "1.5rem 1.5rem 0 0" }}>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Plus className="w-5 h-5" /> Crear Alerta</h2>
                <p className="text-blue-200 text-xs mt-0.5">Notifica a los usuarios sobre un problema</p>
              </div>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-white/70 hover:text-white" /></button>
            </div>
            <div className="px-7 py-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Tipo de Problema</label>
                <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.tipo} onChange={e => setForm(f=>({...f, tipo: e.target.value}))}>
                  {TIPOS_ALERTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Nivel de Urgencia</label>
                <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.nivel} onChange={e => setForm(f=>({...f, nivel: e.target.value}))}>
                  <option value="critica">Crítica</option>
                  <option value="advertencia">Advertencia</option>
                  <option value="info">Informativa</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Equipo Afectado (opcional)</label>
                <select className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" value={form.equipo_id} onChange={e => setForm(f=>({...f, equipo_id: e.target.value}))}>
                  <option value="">Sin equipo específico</option>
                  {equipos.map(e => <option key={e.id} value={e.id}>{e.marca} {e.modelo} – {e.numero_inventario}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Descripción *</label>
                <textarea className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" rows={3} placeholder="Describe el problema o la alerta..." value={form.descripcion} onChange={e => setForm(f=>({...f, descripcion: e.target.value}))} />
              </div>

              {/* Destinatarios */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Notificar por email (opcional)</label>
                {usuarios.length === 0 ? (
                  <p className="text-xs text-slate-400">No hay usuarios registrados</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-100 rounded-xl p-3">
                    {usuarios.map(u => {
                      const sel = form.destinatarios.includes(u.email);
                      return (
                        <label key={u.id} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={sel} onChange={() => toggleDestinatario(u.email)} className="rounded" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">{u.full_name || u.email}</p>
                            <p className="text-xs text-slate-400">{u.email} · {u.role}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                {form.destinatarios.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">{form.destinatarios.length} destinatario(s) seleccionado(s)</p>
                )}
              </div>
            </div>
            <div className="px-7 pb-7 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50">Cancelar</button>
              <button
                onClick={handleCrearAlerta}
                disabled={guardando || !form.descripcion}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #1565c0, #0288d1)" }}
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {enviando ? "Enviando..." : guardando ? "Guardando..." : "Crear y Notificar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}