import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";

export default function Alertas() {
  const [parches, setParches] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    const init = async () => {
      const allEquipos = await base44.entities.EquipoDEA.list();
      setEquipos(allEquipos);
      const allParches = await base44.entities.Parche.list();
      setParches(allParches);
      setLoading(false);
    };
    init();
  }, []);

  const hoy = new Date();

  const getEstadoParche = (p) => {
    const dias = differenceInDays(parseISO(p.fecha_vencimiento), hoy);
    if (dias < 0) return { tipo: "vencido", dias, label: "Vencido", color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500", icon: AlertTriangle };
    if (dias <= 30) return { tipo: "critico", dias, label: `Vence en ${dias} días`, color: "text-red-600 bg-red-50 border-red-100", dot: "bg-red-400", icon: AlertTriangle };
    if (dias <= 90) return { tipo: "proximo", dias, label: `Vence en ${dias} días`, color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-400", icon: Clock };
    return { tipo: "ok", dias, label: `Vigente — ${dias} días`, color: "text-green-700 bg-green-50 border-green-200", dot: "bg-green-400", icon: CheckCircle };
  };

  const parchesConEstado = parches
    .filter(p => p.fecha_vencimiento)
    .map(p => ({ ...p, estado: getEstadoParche(p) }))
    .sort((a, b) => a.estado.dias - b.estado.dias);

  const filtrados = filtro === "todos"
    ? parchesConEstado
    : parchesConEstado.filter(p => p.estado.tipo === filtro);

  const counts = {
    vencido: parchesConEstado.filter(p => p.estado.tipo === "vencido").length,
    critico: parchesConEstado.filter(p => p.estado.tipo === "critico").length,
    proximo: parchesConEstado.filter(p => p.estado.tipo === "proximo").length,
    ok: parchesConEstado.filter(p => p.estado.tipo === "ok").length,
  };

  const tabs = [
    { key: "todos", label: "Todos", count: parchesConEstado.length },
    { key: "vencido", label: "Vencidos", count: counts.vencido },
    { key: "critico", label: "Críticos (≤30d)", count: counts.critico },
    { key: "proximo", label: "Próximos (≤90d)", count: counts.proximo },
    { key: "ok", label: "Vigentes", count: counts.ok },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Alertas de Vencimiento</h1>
        <p className="text-slate-500 mt-1">Control de vencimiento de parches por equipo</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Vencidos", count: counts.vencido, color: "#e63946", bg: "#fff1f2" },
          { label: "Críticos", count: counts.critico, color: "#f97316", bg: "#fff7ed" },
          { label: "Próximos", count: counts.proximo, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Vigentes", count: counts.ok, color: "#10b981", bg: "#ecfdf5" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFiltro(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${filtro === t.key ? "text-white shadow-sm" : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"}`}
            style={filtro === t.key ? { background: "#1a2e4a" } : {}}
          >
            {t.label} {t.count > 0 && <span className="ml-1 opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtrados.map(p => {
          const equipo = equipos.find(e => e.id === p.equipo_id);
          const Icon = p.estado.icon;
          return (
            <div key={p.id} className={`flex items-center justify-between bg-white rounded-2xl border p-5 shadow-sm ${p.estado.color.split(" ").filter(c => c.startsWith("border")).join(" ")}`}>
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.estado.dot}`} />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{equipo?.marca} {equipo?.modelo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {equipo?.establecimiento} · Parches {p.tipo} · {p.cantidad} ud{p.cantidad > 1 ? "s" : ""}
                    {p.lote ? ` · Lote ${p.lote}` : ""}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Vencimiento: {format(parseISO(p.fecha_vencimiento), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${p.estado.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {p.estado.label}
              </div>
            </div>
          );
        })}
        {filtrados.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay parches en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
}