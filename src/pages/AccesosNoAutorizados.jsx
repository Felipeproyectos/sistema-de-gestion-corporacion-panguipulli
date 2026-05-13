import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldX, Mail, Monitor, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AccesosNoAutorizados() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AccesoNoAutorizado.list("-fecha_intento", 100)
      .then(setRegistros)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await base44.entities.AccesoNoAutorizado.delete(id);
    setRegistros(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
          <ShieldX className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Accesos No Autorizados</h1>
          <p className="text-sm text-slate-500">Intentos de acceso de cuentas no registradas</p>
        </div>
        <span className="ml-auto text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
          {registros.length} registro{registros.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : registros.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ShieldX className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin intentos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {registros.map(r => (
            <div key={r.id} className="bg-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ border: "1px solid #FEE2E2", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ background: "#FEF2F2" }}>
                <ShieldX className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-700 truncate">{r.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-500">
                    {r.fecha_intento
                      ? format(new Date(r.fecha_intento), "d MMM yyyy · HH:mm", { locale: es })
                      : "—"}
                  </span>
                </div>
                {r.user_agent && (
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-400 truncate">{r.user_agent}</span>
                  </div>
                )}
              </div>
              <button onClick={() => handleDelete(r.id)}
                className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 self-start sm:self-center">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}