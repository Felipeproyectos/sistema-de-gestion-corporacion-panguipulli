import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

export default function Bienvenida() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    base44.entities.AppConfig.list().then((list) => {
      if (list.length > 0 && list[0].logo_url) setLogoUrl(list[0].logo_url);
    }).catch(() => {});
  }, []);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%)" }}>
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%)" }}
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

      {/* Tarjeta central */}
      <div
        className="relative z-10 flex flex-col items-center w-full mx-4"
        style={{ maxWidth: 400 }}
      >
        <div
          className="bg-white w-full flex flex-col items-center px-10 py-10 gap-6"
          style={{
            borderRadius: 24,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center" style={{ width: 100, height: 100 }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={{ fontSize: 40 }}>🏥</div>
            )}
          </div>

          {/* Título institucional */}
          <div className="text-center">
            <h1 className="text-gray-900 text-xl font-bold tracking-tight mb-1">
              Sistema de Gestión
            </h1>
            <p className="text-gray-500 text-sm">
              Corporación Municipal de Salud de Panguipulli
            </p>
          </div>

          {/* Divisor */}
          <div className="w-full h-px bg-gray-100" />

          {/* Bienvenida */}
          <div className="text-center">
            <h2 className="text-gray-700 text-base font-medium">Bienvenido/a</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Inicia sesión para acceder al sistema
            </p>
          </div>

          {/* Botón login */}
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #1a3a5c, #1d4ed8)",
              boxShadow: "0 4px 14px rgba(26,58,92,0.4)",
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Iniciar Sesión
          </button>

          {/* Nota de acceso */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Acceso exclusivo para personal autorizado
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center" style={{ color: "rgba(147,197,253,0.6)", fontSize: 12 }}>
          Bitácora · Gestión de Equipos Médicos
        </p>
      </div>
    </div>
  );
}