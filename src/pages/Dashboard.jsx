import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Monitor, AlertTriangle, Package, ClipboardList, Activity, ArrowRight, Zap, Car, Wrench, CheckCircle, Clock, Bell, User, MapPin, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays, parseISO, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import usePullToRefresh from "@/hooks/usePullToRefresh";

export default function Dashboard() {
  const [equipos, setEquipos] = useState([]);
  const [parches, setParches] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  const fetchData = useCallback(async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    const [allEquipos, allParches, allSolicitudes, allActividades, allAlertas] = await Promise.all([
      base44.entities.Equipo.list('-updated_date', 100).catch(() => []),
      base44.entities.Parche.list().catch(() => []),
      base44.entities.Solicitud.list().catch(() => []),
      base44.entities.Actividad.list('-created_date', 20).catch(() => []),
      base44.entities.Alerta.filter({ estado: 'activa' }).catch(() => []),
    ]);
    setEquipos(allEquipos);
    setParches(allParches);
    setSolicitudes(allSolicitudes);
    setActividades(allActividades);
    setAlertas(allAlertas);
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const { refreshing } = usePullToRefresh(fetchData, containerRef);

  const hoy = new Date();
  const porVencer = parches.filter(p => {
    const dias = differenceInDays(parseISO(p.fecha_vencimiento), hoy);
    return dias >= 0 && dias <= 90;
  });
  const vencidos = parches.filter(p => differenceInDays(parseISO(p.fecha_vencimiento), hoy) < 0);
  const operativos = equipos.filter(e => e.estado === "operativo");
  const enMantenimiento = equipos.filter(e => e.estado === "mantenimiento");
  const fueraServicio = equipos.filter(e => e.estado === "fuera_de_servicio");
  const pendientes = solicitudes.filter(s => s.estado === "pendiente");

  const TIPO_ACT_LABEL = {
    mantenimiento_preventivo: "Mantenimiento Preventivo",
    mantenimiento_correctivo: "Mantenimiento Correctivo",
    inspeccion: "Inspección",
    inspeccion_semanal: "Inspección Semanal",
    inspeccion_anual: "Inspección Anual",
    incidente: "Incidente",
    traslado: "Traslado",
    otros: "Otros",
    error_calibracion: "Error Calibración"
  };
  const TIPO_ACT_COLOR = {
    mantenimiento_preventivo: { bg: "#eff6ff", color: "#2563eb", icon: Wrench },
    mantenimiento_correctivo: { bg: "#fef2f2", color: "#dc2626", icon: Wrench },
    inspeccion: { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle },
    inspeccion_semanal: { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle },
    inspeccion_anual: { bg: "#eff6ff", color: "#2563eb", icon: CheckCircle },
    incidente: { bg: "#fef2f2", color: "#dc2626", icon: AlertTriangle },
    traslado: { bg: "#fdf4ff", color: "#7c3aed", icon: MapPin },
    otros: { bg: "#f8fafc", color: "#64748b", icon: Activity },
    error_calibracion: { bg: "#fff7ed", color: "#ea580c", icon: AlertTriangle }
  };

  const stats = [
    { label: "Equipos Operativos", value: operativos.length, total: equipos.length, icon: Monitor, color: "#16a34a", bg: "#dcfce7" },
    { label: "En Mantención", value: enMantenimiento.length, total: equipos.length, icon: Wrench, color: "#d97706", bg: "#fef9c3" },
    { label: "Fuera de Servicio", value: fueraServicio.length, total: equipos.length, icon: AlertTriangle, color: "#dc2626", bg: "#fee2e2" },
    { label: "Alertas Activas", value: alertas.length, icon: Bell, color: "#7c3aed", bg: "#f5f3ff" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
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
      <div className="relative overflow-hidden px-6 lg:px-10 pt-12 pb-8" style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 40%, #29b6f6 100%)" }}>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full opacity-20 border-4 border-white" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)" }} />
        <div className="absolute right-32 top-1/3 w-36 h-36 rounded-full opacity-15 border-4 border-cyan-200" />
        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest">Sistema de Gestión de Equipos</p>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">Dashboard</h1>
              <p className="text-blue-100 text-sm mt-0.5">Bienvenido, {user?.full_name || user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-6 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="group relative bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300" style={{ boxShadow: "0 8px 32px rgba(21,101,192,0.12)" }}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: s.bg }}>
                    <Icon className="w-6 h-6" style={{ color: s.color }} />
                  </div>
                  <p className="text-3xl font-bold mb-1" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                  {s.total !== undefined && (
                    <p className="text-xs text-slate-400 mt-1">de {s.total} totales</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenido principal en 2 columnas */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda: Estado equipos + Alertas */}
        <div className="lg:col-span-2 space-y-6">

          {/* Estado de Equipos */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(21,101,192,0.10)" }}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Monitor className="w-4 h-4 text-blue-600" />
                </div>
                Estado de Equipos
              </h2>
              <Link to={createPageUrl("Equipos2")} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Ver todos <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Barra resumen */}
            <div className="px-6 py-3 grid grid-cols-3 divide-x divide-slate-100" style={{ background: "#f8fafc" }}>
              {[
                { label: "Operativos", n: operativos.length, color: "#16a34a", bg: "#dcfce7" },
                { label: "En Mantención", n: enMantenimiento.length, color: "#d97706", bg: "#fef9c3" },
                { label: "Fuera Servicio", n: fueraServicio.length, color: "#dc2626", bg: "#fee2e2" }
              ].map(s => (
                <div key={s.label} className="text-center px-3">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.n}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Lista equipos */}
            <div className="divide-y divide-slate-50">
              {equipos.slice(0, 8).map(e => {
                const TIPO_ICON = { ambulancia: Car, dea: Zap, monitor_desfibrilador: Activity, monitor_multiparametros: Monitor };
                const EIcon = TIPO_ICON[e.tipo] || Monitor;
                const estadoCfg = {
                  operativo: { dot: "#16a34a", bg: "#dcfce7", label: "Operativo" },
                  mantenimiento: { dot: "#d97706", bg: "#fef9c3", label: "Mantención" },
                  fuera_de_servicio: { dot: "#dc2626", bg: "#fee2e2", label: "Fuera Serv." }
                }[e.estado] || { dot: "#94a3b8", bg: "#f1f5f9", label: e.estado };
                return (
                  <div key={e.id} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#eff6ff" }}>
                        <EIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{e.marca} {e.modelo}</p>
                        <p className="text-xs text-slate-400">{e.centro_principal}{e.subsede ? ` / ${e.subsede}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: estadoCfg.dot }} />
                      <span className="text-xs font-semibold" style={{ color: estadoCfg.dot }}>{estadoCfg.label}</span>
                    </div>
                  </div>
                );
              })}
              {equipos.length === 0 && (
                <div className="px-6 py-10 text-center text-slate-400 text-sm">
                  <Monitor className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  No hay equipos registrados
                </div>
              )}
            </div>
          </div>

          {/* Alertas activas */}
          {(alertas.length > 0 || vencidos.length > 0) && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(21,101,192,0.10)" }}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-red-600" />
                  </div>
                  Alertas Activas
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">{alertas.length + vencidos.length}</span>
                </h2>
                <Link to={createPageUrl("AlertasV2")} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  Ver todas <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {vencidos.slice(0, 3).map(p => {
                  const equipo = equipos.find(eq => eq.id === p.equipo_id);
                  return (
                    <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{equipo?.marca} {equipo?.modelo}</p>
                          <p className="text-xs text-slate-400">Parche {p.tipo} vencido</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">VENCIDO</span>
                    </div>
                  );
                })}
                {alertas.slice(0, 4).map(al => {
                  const equipo = equipos.find(eq => eq.id === al.equipo_id);
                  const nivelCfg = { critica: { bg: "#fee2e2", color: "#dc2626" }, advertencia: { bg: "#fef9c3", color: "#d97706" }, info: { bg: "#eff6ff", color: "#2563eb" } }[al.nivel] || { bg: "#f1f5f9", color: "#64748b" };
                  return (
                    <div key={al.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: nivelCfg.bg }}>
                          <AlertTriangle className="w-4 h-4" style={{ color: nivelCfg.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{equipo?.marca} {equipo?.modelo}</p>
                          <p className="text-xs text-slate-400">{al.descripcion}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: nivelCfg.bg, color: nivelCfg.color }}>{al.nivel?.toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: Últimos acontecimientos */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(21,101,192,0.10)" }}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                Últimas Actividades
              </h2>
              <Link to={createPageUrl("Actividades")} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                Ver más <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {actividades.slice(0, 12).map(act => {
                const equipo = equipos.find(e => e.id === act.equipo_id);
                const cfg = TIPO_ACT_COLOR[act.tipo] || TIPO_ACT_COLOR.otros;
                const ActIcon = cfg.icon;
                let timeAgo = "";
                try {
                  timeAgo = act.created_date
                    ? formatDistanceToNow(new Date(act.created_date), { addSuffix: true, locale: es })
                    : act.fecha;
                } catch { timeAgo = act.fecha; }
                return (
                  <div key={act.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                      <ActIcon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {TIPO_ACT_LABEL[act.tipo] || act.tipo}
                      </p>
                      {equipo && (
                        <p className="text-xs text-slate-500 truncate">{equipo.marca} {equipo.modelo}</p>
                      )}
                      {act.usuario_nombre && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />{act.usuario_nombre}
                        </p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: cfg.color }}>{timeAgo}</p>
                    </div>
                  </div>
                );
              })}
              {actividades.length === 0 && (
                <div className="px-5 py-10 text-center text-slate-400 text-sm">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  Sin actividades recientes
                </div>
              )}
            </div>
          </div>

          {/* Solicitudes pendientes */}
          {pendientes.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ boxShadow: "0 8px 32px rgba(21,101,192,0.10)" }}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-amber-600" />
                  </div>
                  Solicitudes Pendientes
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{pendientes.length}</span>
                </h2>
              </div>
              <div className="divide-y divide-slate-50">
                {pendientes.slice(0, 5).map(sol => {
                  const equipo = equipos.find(e => e.id === sol.equipo_id);
                  return (
                    <div key={sol.id} className="px-5 py-3">
                      <p className="text-xs font-semibold text-slate-800">{sol.tipo?.replace(/_/g, " ")}</p>
                      {equipo && <p className="text-xs text-slate-500">{equipo.marca} {equipo.modelo}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">{sol.centro || "—"} · {sol.fecha}</p>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 border-t border-slate-100">
                <Link to={createPageUrl("SolicitudesV2")} className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                  Ver todas las solicitudes <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}