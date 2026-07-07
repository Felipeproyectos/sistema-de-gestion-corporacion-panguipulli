import {
  LayoutDashboard, Monitor, Bell, ClipboardList, FileText, History,
  Settings, Wrench, Building2, Package, ShieldX, BarChart3, Users
} from "lucide-react";
import { ROLES } from "@/lib/roles";

// Matriz de navegación por rol. Roles finales:
// super_admin (Base del Sistema) · admin · encargado_salud ·
// encargado_compras_salud · monitor_corporativo · jefe_taller ·
// encargado_compras_taller · mecanico · user (Usuario/Chofer)
export const NAV_ITEMS = [
  { label: "Dashboard", page: "Dashboard", path: "/", icon: LayoutDashboard,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ENCARGADO_SALUD, ROLES.ENCARGADO_COMPRAS_SALUD, ROLES.USER] },

  { label: "Taller", page: "Taller", path: "/Taller", icon: Wrench,
    roles: [ROLES.SUPER_ADMIN, ROLES.JEFE_TALLER, ROLES.MECANICO] },

  { label: "Equipos", page: "Equipos2", path: "/Equipos2", icon: Monitor,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ENCARGADO_SALUD, ROLES.ENCARGADO_COMPRAS_SALUD, ROLES.USER] },

  { label: "Alertas", page: "AlertasV2", path: "/AlertasV2", icon: Bell,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ENCARGADO_SALUD, ROLES.ENCARGADO_COMPRAS_SALUD, ROLES.USER] },

  { label: "Solicitudes", page: "SolicitudesV2", path: "/SolicitudesV2", icon: ClipboardList,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ENCARGADO_SALUD, ROLES.ENCARGADO_COMPRAS_SALUD, ROLES.USER] },

  { label: "Repuestos", page: "Repuestos", path: "/Repuestos", icon: Package,
    roles: [ROLES.SUPER_ADMIN, ROLES.JEFE_TALLER, ROLES.MECANICO, ROLES.ENCARGADO_COMPRAS_TALLER] },

  { label: "Proveedores", page: "Proveedores", path: "/Proveedores", icon: Building2,
    roles: [ROLES.SUPER_ADMIN, ROLES.JEFE_TALLER, ROLES.ENCARGADO_COMPRAS_TALLER, ROLES.ENCARGADO_COMPRAS_SALUD] },

  { label: "Revisión Bitácora", page: "RevisionInspecciones", path: "/RevisionInspecciones", icon: ClipboardList,
    roles: [ROLES.SUPER_ADMIN, ROLES.ENCARGADO_SALUD] },

  { label: "Reportes", page: "Reportes", path: "/Reportes", icon: FileText,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ENCARGADO_SALUD, ROLES.JEFE_TALLER, ROLES.MONITOR_CORPORATIVO] },

  { label: "Monitor Corporativo", page: "MonitorCorporativo", path: "/MonitorCorporativo", icon: BarChart3,
    roles: [ROLES.SUPER_ADMIN, ROLES.MONITOR_CORPORATIVO] },

  { label: "Historial", page: "Historial", path: "/Historial", icon: History,
    roles: [ROLES.SUPER_ADMIN] },

  { label: "Configuración", page: "Configuracion", path: "/Configuracion", icon: Settings,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },

  { label: "Accesos No Autorizados", page: "AccesosNoAutorizados", path: "/AccesosNoAutorizados", icon: ShieldX,
    roles: [ROLES.SUPER_ADMIN] },

  { label: "Usuarios", page: "Usuarios", path: "/Usuarios", icon: Users,
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ENCARGADO_SALUD, ROLES.JEFE_TALLER] },
];

export function getNavItemsForRole(role) {
  return NAV_ITEMS.filter(item => item.roles.includes(role || ROLES.USER));
}
