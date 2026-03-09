import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Heart,
  LayoutDashboard,
  Monitor,
  ClipboardList,
  Users,
  Menu,
  X,
  LogOut,
  Bell,
  Settings
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [appConfig, setAppConfig] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.AppConfig.list().then(list => {
      if (list.length > 0) setAppConfig(list[0]);
    }).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";

  const navItems = [
    { label: "Dashboard", page: "Dashboard", icon: LayoutDashboard, adminOnly: false },
    { label: "Equipos DEA", page: "Equipos", icon: Monitor, adminOnly: false },
    { label: "Solicitudes", page: "Solicitudes", icon: ClipboardList, adminOnly: false },
    { label: "Alertas", page: "Alertas", icon: Bell, adminOnly: false },
    { label: "Usuarios", page: "Usuarios", icon: Users, adminOnly: true },
    { label: "Configuración", page: "Configuracion", icon: Settings, adminOnly: true },
  ];

  const visibleItems = navItems.filter(i => !i.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        :root {
          --primary: #1a2e4a;
          --accent: #e63946;
          --accent-light: #fff1f2;
        }
        .nav-link { transition: all 0.2s ease; }
        .nav-link:hover { background: rgba(255,255,255,0.08); }
        .nav-link.active { background: rgba(230,57,70,0.18); border-left: 3px solid #e63946; }
      `}</style>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen" style={{ background: "#1a2e4a" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-7 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#e63946" }}>
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">DEA Manager</p>
            <p className="text-white/40 text-xs mt-0.5">Sistema de gestión</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`nav-link flex items-center gap-3 px-4 py-2.5 rounded-lg ${isActive ? "active" : ""}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-red-400" : "text-white/50"}`} />
                <span className={`text-sm font-medium ${isActive ? "text-white" : "text-white/60"}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        {user && (
          <div className="px-4 py-5 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#e63946" }}>
                {user.full_name?.charAt(0) || user.email?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user.full_name || user.email}</p>
                <p className="text-white/40 text-xs capitalize">{user.role || "user"}</p>
              </div>
              <button onClick={() => base44.auth.logout()} className="text-white/30 hover:text-white/70 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4" style={{ background: "#1a2e4a" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#e63946" }}>
            <Heart className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">DEA Manager</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-white">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-16" style={{ background: "#1a2e4a" }}>
          <nav className="px-4 py-4 space-y-1">
            {visibleItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMenuOpen(false)}
                  className={`nav-link flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? "active" : ""}`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-red-400" : "text-white/50"}`} />
                  <span className={`text-sm font-medium ${isActive ? "text-white" : "text-white/60"}`}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:overflow-auto">
        <div className="lg:hidden h-16" />
        {children}
      </main>
    </div>
  );
}