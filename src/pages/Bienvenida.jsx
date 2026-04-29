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
                </div>div>
              );
  }

  return (
        <div
                className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #0d2137 100%)" }}
              >
              <div className="absolute top-0 left-0 w-96 h-96 rounded-full" style={{ background: "rgba(255,255,255,0.08)", transform: "translate(-40%, -40%)" }} />
              <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full" style={{ background: "rgba(255,255,255,0.08)", transform: "translate(40%, 40%)" }} />
        
              <div className="relative z-10 flex flex-col items-center w-full mx-4" style={{ maxWidth: 420 }}>
                      <div
                                  className="bg-white w-full flex flex-col items-center px-10 py-10 gap-5"
                                  style={{ borderRadius: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.35), 0 4px 16px rgba(0,0,0,0.15)" }}
                                >
                                <div className="flex items-center justify-center" style={{ width: 100, height: 100 }}>
                                  {logoUrl ? (
                                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = "none"; }} />
                                              ) : (
                                                <div style={{ fontSize: 40 }}>&#x1F3E5;</div>div>
                                            )}
                                </div>div>
                      
                                <div className="text-center">
                                            <h1 className="font-bold tracking-tight mb-1" style={{ color: "#1a3a5c", fontSize: 18 }}>
                                                          Sistema de Gestion - Corporacion Panguipulli
                                            </h1>h1>
                                            <p className="text-gray-500 text-sm">Corporacion Municipal de Salud de Panguipulli</p>p>
                                </div>div>
                      
                                <div className="w-full h-px bg-gray-100" />
                      
                                <div className="text-center">
                                            <h2 className="text-gray-700 text-base font-medium">Bienvenido/a</h2>h2>
                                            <p className="text-gray-400 text-sm mt-0.5">Inicia sesion para acceder al sistema</p>p>
                                </div>div>
                      
                                <button
                                              onClick={handleLogin}
                                              className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                                              style={{ background: "#1a3a5c", boxShadow: "0 4px 14px rgba(26,58,92,0.4)" }}
                                            >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>svg>
                                            Iniciar Sesion con Google
                                </button>button>
                      
                                <div className="w-full flex items-center gap-3">
                                            <div className="flex-1 h-px bg-gray-200" />
                                            <span className="text-gray-400 text-xs">o</span>span>
                                            <div className="flex-1 h-px bg-gray-200" />
                                </div>div>
                      
                                <button
                                              onClick={handleLogin}
                                              className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
                                              style={{ background: "#1a3a5c", boxShadow: "0 4px 14px rgba(26,58,92,0.4)" }}
                                            >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>svg>
                                            Iniciar Sesion con Correo
                                </button>button>
                      
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>svg>
                                            Acceso exclusivo para personal autorizado
                                </div>div>
                      </div>div>
              
                      <p className="mt-6 text-center" style={{ color: "rgba(147,197,253,0.7)", fontSize: 12 }}>
                                Corporacion Municipal Panguipulli &copy; 2026
                      </p>p>
              </div>div>
        </div>div>
      );
}</div>
