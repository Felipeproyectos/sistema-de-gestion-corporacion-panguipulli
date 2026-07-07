// Simulador de roles: permite al super_admin visualizar la navegación
// desde la perspectiva de otros roles. Solo afecta el frontend (nav),
// no cambia permisos reales del backend.
const KEY = "b44_role_simulator";

export function getSimulatedRole() {
  try { return localStorage.getItem(KEY) || null; } catch { return null; }
}

export function setSimulatedRole(role) {
  try {
    if (role) localStorage.setItem(KEY, role);
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("role-simulator-change", { detail: role }));
  } catch {}
}

export function clearSimulatedRole() {
  setSimulatedRole(null);
}

// Rol efectivo para navegación: si hay simulación activa, usa esa;
// si no, usa el rol real del usuario.
export function getEffectiveNavRole(realRole) {
  const sim = getSimulatedRole();
  // Super admin y admin (propietario) pueden simular roles
  if (["super_admin", "admin"].includes(realRole) && sim) return sim;
  return realRole;
}

export const ALL_ROLES = [
  { value: "super_admin", label: "Super Administrador", color: "#7C3AED" },
  { value: "admin", label: "Administrador", color: "#2563EB" },
  { value: "monitor_corporativo", label: "Monitor Corporativo", color: "#0891B2" },
  { value: "admin_salud", label: "Admin Salud", color: "#059669" },
  { value: "supervisor", label: "Supervisor (Salud)", color: "#0D9488" },
  { value: "operador", label: "Operador (Salud)", color: "#65A30D" },
  { value: "user", label: "Usuario (Salud)", color: "#16A34A" },
  { value: "jefe_taller", label: "Jefe de Taller", color: "#EA580C" },
  { value: "mecanico", label: "Mecánico", color: "#C2410C" },
];