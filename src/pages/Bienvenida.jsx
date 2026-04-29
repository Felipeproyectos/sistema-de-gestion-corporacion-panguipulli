import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

const LOGO_URL = "https://base44.app/api/apps/69d7d4a3a315ab3667225ef2/files/mp/public/69d7d4a3a315ab3667225ef2/92f1994ca_logosalud.png";

export default function Bienvenida() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Si ya está autenticado, ir al dashboard
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) {
        navigate("/Dashboard", { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  const handleLogin = () => {
    base44.auth.redirectToLogin("/Dashboard");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)" }}>
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)" }}
    >
      {/* Círculos decorativos de fondo */}
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)", transform: "translate(-40%, -40%)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)", transform: "translate(40%, 40%)" }}
      />
      <div
        className="absolute top-1/2 left-0 w-64 h-64 rounded-full"
        style={{ background: "rgba(255,255,255,0.04)", transform: "translate(-50%, -50%)" }}
      />

      {/* Contenido central */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-4 px-4">

        {/* Logo */}
        <div className="mb-6 flex items-center justify-center">
          <div
            className="bg-white rounded-2xl shadow-2xl flex items-center justify-center"
            style={{ width: 120, height: 120, padding: 16 }}
          >
            <img
              src={LOGO_URL}
              alt="Logo Corporación de Salud"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.parentElement.innerHTML = `<div style="font-size:36px">🏥</div>`;
              }}
            />
          </div>
        </div>

        {/* Título institucional */}
        <h1 className="text-white text-2xl font-bold text-center mb-1 tracking-tight">
          Sistema de Gestión
        </h1>
        <p className="text-center mb-8" style={{ color: "rgba(191,219,254,0.9)", fontSize: 14 }}>
          Corporación Municipal de Salud de Panguipulli
        </p>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-2xl w-full px-8 py-8 flex flex-col items-center gap-5">
          <div className="text-center">
            <h2 className="text-gray-800 text-lg font-semibold">Bienvenido/a</h2>
            <p className="text-gray-500 text-sm mt-1">
              Inicia sesión para acceder al sistema Bitácora
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95 shadow-lg"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Iniciar Sesión
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Acceso exclusivo para personal autorizado
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center" style={{ color: "rgba(147,197,253,0.6)", fontSize: 12 }}>
          Bitácora · Gestión de Equipos Médicos
        </p>
      </div>
    </div>
  );
}