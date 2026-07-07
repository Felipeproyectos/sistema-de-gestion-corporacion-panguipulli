import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { History, User as UserIcon, Clock, ShieldAlert } from "lucide-react";
import { ROLES } from "@/lib/roles";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Historial() {
  const [registros, setRegistros] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Historial.list("-fecha", 200)
      .then(setRegistros)
      .finally(() => setLoading(false));
  }, []);

  const esBaseDelSistema = user?.role === ROLES.SUPER_ADMIN;

  if (!loading && !esBaseDelSistema) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Acceso restringido</p>
          <p className="text-slate-400 text-sm mt-1">El historial de auditoría es exclusivo de Base del Sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #64748b, #475569)" }}>
          <History className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Historial de Auditoría</h1>
          <p className="text-sm text-slate-500">Registro de acciones realizadas en el sistema</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : registros.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin registros</p>
        </div>
      ) : (
        <div className="space-y-2">
          {registros.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-4 flex items-start gap-3 border border-slate-100">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-100">
                <UserIcon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{r.descripcion || `${r.accion} en ${r.entidad}`}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400">
                    {r.fecha ? format(new Date(r.fecha), "d MMM yyyy · HH:mm", { locale: es }) : "—"}
                  </span>
                  {r.usuario_email && <span className="text-xs text-slate-400">· {r.usuario_email}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
