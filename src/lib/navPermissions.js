import {
  LayoutDashboard, Monitor, Bell, ClipboardList, FileText, History,
  Settings, Wrench, Building2, Package, ShieldX, BarChart3, Users
} from "lucide-react";

// Matriz de permisos por rol.
// Roles: admin, super_admin, monitor_corporativo, admin_salud,
//        jefe_taller, mecanico, supervisor, operador, user
export const NAV_ITEMS = [
  { label: "Dashboard", page: "Dashboard", path: "/", icon: LayoutDashboard,
    roles: ["admin", "super_admin", "admin_salud", "supervisor", "operador", "user"] },
  { label: "Taller", page: "Taller", path: "/Taller", icon: Wrench,
    roles: ["admin", "super_admin", "jefe_taller", "mecanico"] },
  { label: "Equipos", page: "Equipos2", path: "/Equipos2", icon: Monitor,
    roles: ["admin", "super_admin", "admin_salud", "supervisor", "operador", "user"] },
  { label: "Alertas", page: "AlertasV2", path: "/AlertasV2", icon: Bell,
    roles: ["admin", "super_admin", "admin_salud", "supervisor", "operador", "user"] },
  { label: "Solicitudes", page: "SolicitudesV2", path: "/SolicitudesV2", icon: ClipboardList,
    roles: ["admin", "super_admin", "admin_salud", "supervisor", "operador", "user"] },
  { label: "Repuestos", page: "Repuestos", path: "/Repuestos", icon: Package,
    roles: ["admin", "super_admin", "jefe_taller", "mecanico"] },
  { label: "Proveedores", page: "Proveedores", path: "/Proveedores", icon: Building2,
    roles: ["admin", "super_admin", "jefe_taller"] },
  { label: "Revisión Bitácora", page: "RevisionInspecciones", path: "/RevisionInspecciones", icon: ClipboardList,
    roles: ["admin", "super_admin", "admin_salud", "supervisor"] },
  { label: "Reportes", page: "Reportes", path: "/Reportes", icon: FileText,
    roles: ["admin", "super_admin", "admin_salud", "jefe_taller", "supervisor"] },
  { label: "Monitor Corporativo", page: "MonitorCorporativo", path: "/MonitorCorporativo", icon: BarChart3,
    roles: ["admin", "super_admin", "monitor_corporativo", "jefe_taller"] },
  { label: "Historial", page: "Historial", path: "/Historial", icon: History,
    roles: ["admin", "super_admin", "admin_salud"] },
  { label: "Configuración", page: "Configuracion", path: "/Configuracion", icon: Settings,
    roles: ["admin", "super_admin"] },
  { label: "Accesos No Autorizados", page: "AccesosNoAutorizados", path: "/AccesosNoAutorizados", icon: ShieldX,
    roles: ["admin", "super_admin"] },
  { label: "Usuarios", page: "Usuarios", path: "/Usuarios", icon: Users,
    roles: ["super_admin"] },
];

export function getNavItemsForRole(role) {
  return NAV_ITEMS.filter(item => item.roles.includes(role || "user"));
}