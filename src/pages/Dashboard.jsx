import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Monitor, AlertTriangle, CheckCircle, ClipboardList, TrendingUp } from "lucide-react";
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
      const u = await base44.auth.me().catch(() => null);
      setUser(u);
      const [allEquipos, allParches, allSolicitudes] = await Promise.all([
        base44.entities.EquipoDEA.list(),
        base44.entities.Parche.list(),
        base44.entities.SolicitudStock.list(),
      ]);
      setEquipos(allEquipos);
      setParches(allParches);
      setSolicitudes(allSolicitudes);
      setLoading(false);
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
    { label: "Equipos Activos", value: operativos.length, total: equipos.length, icon: Monitor, color: "#10b981", bg: "#ecfdf5" },
    { label: "Parches por Vencer", value: porVencer.length, icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb" },
    { label: "Parches Vencidos", value: vencidos.length, icon: AlertTriangle, color: "#e63946", bg: "#fff1f2" },
    { label: "Solicitudes Pendientes", value: pendientes.length, icon: ClipboardList, color: "#6366f1", bg: "#eef2ff" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Bienvenido, {user?.full_name || user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-2xl p-5 bg-white shadow-sm border border-slate-100">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              {s.total !== undefined && (
                <p className="text-xs text-slate-400 mt-1">de {s.total} totales</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Alertas recientes */}
      {(porVencer.length > 0 || vencidos.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Alertas de Parches
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {vencidos.slice(0, 3).map(p => {
              const equipo = equipos.find(e => e.id === p.equipo_id);
              return (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{equipo?.marca} {equipo?.modelo}</p>
                    <p className="text-xs text-slate-500">Parches {p.tipo} — Lote {p.lote || "-"}</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full text-red-700 bg-red-50">VENCIDO</span>
                </div>
              );
            })}
            {porVencer.slice(0, 3).map(p => {
              const equipo = equipos.find(e => e.id === p.equipo_id);
              const dias = differenceInDays(parseISO(p.fecha_vencimiento), hoy);
              return (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{equipo?.marca} {equipo?.modelo}</p>
                    <p className="text-xs text-slate-500">Parches {p.tipo} — Vence en {dias} días</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full text-amber-700 bg-amber-50">PRÓXIMO</span>
                </div>
              );
            })}
          </div>
          <div className="px-6 py-3">
            <Link to={createPageUrl("Alertas")} className="text-xs text-red-600 font-medium hover:underline">Ver todas las alertas →</Link>
          </div>
        </div>
      )}

      {/* Equipos resumen */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Equipos DEA</h2>
          <Link to={createPageUrl("Equipos")} className="text-xs text-red-600 font-medium hover:underline">Ver todos →</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {equipos.slice(0, 5).map(e => (
            <div key={e.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{e.marca} {e.modelo}</p>
                <p className="text-xs text-slate-500">{e.establecimiento} — {e.lugar_destinado}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                e.estado === "operativo" ? "bg-green-50 text-green-700" :
                e.estado === "mantenimiento" ? "bg-amber-50 text-amber-700" :
                "bg-red-50 text-red-700"
              }`}>{e.estado?.replace("_", " ")}</span>
            </div>
          ))}
          {equipos.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">No hay equipos asignados</div>
          )}
        </div>
      </div>
    </div>
  );
}