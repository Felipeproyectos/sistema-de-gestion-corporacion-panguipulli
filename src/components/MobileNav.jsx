import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Monitor, ClipboardList, Bell } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Equipos", path: "/Equipos2", icon: Monitor },
  { label: "Solicitudes", path: "/SolicitudesV2", icon: ClipboardList },
  { label: "Alertas", path: "/AlertasV2", icon: Bell },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white border-t border-slate-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)", height: "calc(56px + env(safe-area-inset-bottom))" }}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
            style={{ color: isActive ? "#2563EB" : "#94A3B8" }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}