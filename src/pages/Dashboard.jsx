import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Monitor, AlertTriangle, Package, ClipboardList, Activity, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays, parseISO } from "date-fns";

export default function Dashboard() {
  const [equipos, setEquipos] = useState([]);
  const [parches, setParches] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me().catch(() => null);
        setUser(u);
        const [allEquipos, allParches, allSolicitudes] = await Promise.all([
          base44.entities.Equipo.list().catch(() => []),
          base44.entities.Parche.list().catch(() => []),
          base44.entities.Solicitud.list().catch(() => []),
        ]);
        setEquipos(allEquipos);
        setParches(allParches);
        setSolicitudes(allSolicitudes);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const hoy = new Date();
  const porVencer = parches.filter(p => {
    const dias = differenceInDays(parseISO(p.fecha_vencimiento), hoy);
    return dias >= 0 && dias <= 90;
  });
  const vencidos = parches.filter(p => differenceInDays(parseISO(p.fecha_vencimiento), hoy) < 0);
  const operativos = equipos.filter(e => e.estado === "operativo");
  const pendientes = solicitudes.filter(s => s.estado === "pendiente");

  const stats = [
    { label: "Equipos Activos", value: operativos.length, total: equipos.length, icon: Monitor, color: "#3b82f6", bg: "#eff6ff" },
    { label: "Parches por Vencer", value: porVencer.length, icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Parches Vencidos", value: vencidos.length, icon: Package, color: "#e63946", bg: "#fff1f2" },
    { label: "Solicitudes Pendientes", value: pendientes.length, icon: ClipboardList, color: "#8b5cf6", bg: "#f5f3ff" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#e8f4fd" }}>
      {/* Header con gradiente azul-cian */}
      <div className="relative overflow-hidden px-6 lg:px-10 pt-12 pb-8" style={{ background: "linear-gradient(135deg, #0f2d6b 0%, #1565c0 40%, #29b6f6 100%)" }}>
        {/* Círculos decorativos al estilo de la imagen */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full opacity-20 border-4 border-white" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)" }} />
        <div className="absolute right-32 top-1/3 w-36 h-36 rounded-full opacity-15 border-4 border-cyan-200" style={{ background: "radial-gradient(circle, rgba(100,220,255,0.2) 0%, transparent 70%)" }} />
        <div className="absolute right-4 bottom-0 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #29b6f6 0%, transparent 70%)" }} />
        {/* Puntos decorativos */}
        <div className="absolute left-6 bottom-4 opacity-20" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "12px 12px", width: 80, height: 50 }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-cyan-200 text-xs font-semibold uppercase tracking-widest">Sistema de Gestión</p>
              <h1 className="text-3xl lg:text-4xl font-bold text-white">Dashboard DEA</h1>
              <p className="text-blue-100 text-sm mt-0.5">Bienvenido, {user?.full_name || user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - elevadas sobre el header */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-6 mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="group relative bg-white rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300 border-0" style={{ boxShadow: "0 8px 32px rgba(21,101,192,0.12)" }}>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, rgba(41,182,246,0.04) 0%, rgba(21,101,192,0.06) 100%)" }} />
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

      {/* Alertas recientes */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 mb-8">
        {(porVencer.length > 0 || vencidos.length > 0) && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl border border-red-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-white/60 backdrop-blur-sm border-b border-red-100/50">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-red-600" />
                  </div>
                  Alertas Críticas
                </h2>
                <Link to={createPageUrl("Alertas")} className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:gap-2 transition-all">
                  Ver todas <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {vencidos.slice(0, 3).map(p => {
                const equipo = equipos.find(e => e.id === p.equipo_id);
                return (
                  <div key={p.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{equipo?.marca} {equipo?.modelo}</p>
                        <p className="text-xs text-slate-500">Parches {p.tipo} — Lote {p.lote || "-"}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full text-red-700 bg-red-100 border border-red-200">VENCIDO</span>
                  </div>
                );
              })}
              {porVencer.slice(0, 3).map(p => {
                const equipo = equipos.find(e => e.id === p.equipo_id);
                const dias = differenceInDays(parseISO(p.fecha_vencimiento), hoy);
                return (
                  <div key={p.id} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow border border-amber-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{equipo?.marca} {equipo?.modelo}</p>
                        <p className="text-xs text-slate-500">Parches {p.tipo} — Vence en {dias} días</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full text-amber-700 bg-amber-100 border border-amber-200">PRÓXIMO</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Equipos resumen */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 pb-10">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Monitor className="w-4 h-4 text-blue-600" />
              </div>
              Equipos DEA Recientes
            </h2>
            <Link to={createPageUrl("Equipos")} className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:gap-2 transition-all">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {equipos.slice(0, 5).map(e => (
              <div key={e.id} className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Monitor className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{e.marca} {e.modelo}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{e.establecimiento} — {e.lugar_destinado}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                  e.estado === "operativo" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  e.estado === "mantenimiento" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-red-50 text-red-700 border-red-200"
                }`}>{e.estado?.replace("_", " ").toUpperCase()}</span>
              </div>
            ))}
            {equipos.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                <Monitor className="w-12 h-12 mx-auto mb-3 opacity-20" />
                No hay equipos asignados
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}