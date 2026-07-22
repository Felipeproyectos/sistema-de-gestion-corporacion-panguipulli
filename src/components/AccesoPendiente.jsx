import React from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, ShieldX, LogOut, Mail } from 'lucide-react';

// Pantalla mostrada a un usuario autenticado pero cuyo acceso a la app aún no
// ha sido aprobado (estado 'pendiente') o fue rechazado por un administrador.
export default function AccesoPendiente({ email, rechazado = false }) {
  const Icon = rechazado ? ShieldX : Clock;
  const titulo = rechazado ? 'Acceso Denegado' : 'Acceso Pendiente de Aprobación';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4"
      style={{ background: "linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)" }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
        <div className="px-8 py-6 flex flex-col items-center"
          style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white text-center">{titulo}</h1>
          <p className="text-blue-100 text-sm text-center mt-1">Sistema de Gestión de Equipos Médicos</p>
        </div>

        <div className="px-8 py-7 space-y-5">
          <p className="text-slate-700 text-sm text-center leading-relaxed">
            {rechazado ? (
              <>Tu solicitud de acceso <strong>fue rechazada</strong>. Si crees que esto es un error, contacta al administrador del sistema.</>
            ) : (
              <>Tu cuenta fue registrada pero <strong>aún no ha sido autorizada</strong>. Un administrador debe aprobar tu acceso antes de que puedas ingresar al sistema.</>
            )}
          </p>

          {email && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
              <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="text-blue-700 font-medium truncate">{email}</span>
            </div>
          )}

          <button
            onClick={() => base44.auth.logout()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}