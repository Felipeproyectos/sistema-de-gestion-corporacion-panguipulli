import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, Edit, Trash2, Plus, Info, Wrench, ClipboardCheck, Package, BookOpen,
  MapPin, Calendar, User, ChevronRight, Upload, AlertTriangle, CheckCircle,
  Activity, Car, Zap, Monitor, Hash, FileText, Gauge
} from "lucide-react";
import { TIPOS_EQUIPO, ESTADOS_EQUIPO, TIPOS_ACTIVIDAD, CENTROS_ESTRUCTURA } from "@/lib/centros";
import { format, parseISO, differenceInDays } from "date-fns";

const TIPO_ICONS = {
  dea: Zap,
  monitor_desfibrilador: Activity,
  ambulancia: Car,
  monitor_multiparametros: Monitor
};

export default function EquipoDetalleModal({ equipo, parches, onClose, onEdit, onDeleted, user, onActividadCreada }) {
  const [actividades, setActividades] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState("info");

  const isAdmin = user?.role === "admin";
  const estado = ESTADOS_EQUIPO.find(e => e.value === equipo.estado) || ESTADOS_EQUIPO[0];
  const tipoLabel = TIPOS_EQUIPO.find(t => t.value === equipo.tipo)?.label || equipo.tipo;
  const Icon = TIPO_ICONS[equipo.tipo] || Monitor;

  useEffect(() => {
    base44.entities.Actividad.filter({ equipo_id: equipo.id }).then(setActividades).catch(() => {});
  }, [equipo.id]);

  const reloadActividades = () => {
    base44.entities.Actividad.filter({ equipo_id: equipo.id }).then(setActividades).catch(() => {});
    onActividadCreada && onActividadCreada();
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este equipo? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    await base44.entities.Equipo.delete(equipo.id);
    onDeleted();
  };

  const esAmbulancia = equipo.tipo === "ambulancia";

  const navItems = [
    { key: "info", label: "Información", icon: Info },
    { key: "mantenimiento", label: "Mantenimiento", icon: Wrench },
    { key: "inspecciones", label: "Inspecciones", icon: ClipboardCheck },
    ...(!esAmbulancia ? [{ key: "parches", label: "Parches", icon: Package }] : []),
    ...(esAmbulancia ? [
      { key: "repuestos", label: "Repuestos", icon: Gauge },
      { key: "bitacora", label: "Bitácora", icon: BookOpen }
    ] : [])
  ];

  const estadoColor = {
    operativo: "#10B981",
    mantenimiento: "#F59E0B",
    fuera_de_servicio: "#EF4444"
  }[equipo.estado] || "#94A3B8";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ borderRadius: "16px", boxShadow: "0 20px 50px rgba(0,0,0,0.18)" }}>

        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EFF6FF" }}>
              <Icon className="w-5 h-5" style={{ color: "#2563EB" }} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg" style={{ letterSpacing: "-0.02em" }}>
                {equipo.marca} {equipo.modelo}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Hash className="w-3 h-3" />{equipo.numero_inventario || "—"}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">{tipoLabel}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ color: estadoColor, background: `${estadoColor}18`, border: `1px solid ${estadoColor}33` }}>
              ● {estado.label}
            </span>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors" title="Editar">
              <Edit className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button onClick={handleDelete} disabled={deleting} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── BODY: sidebar + content ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar nav */}
          <div className="w-44 flex-shrink-0 border-r py-4 flex flex-col gap-1 px-2" style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}>
            {navItems.map(item => {
              const ItemIcon = item.icon;
              const active = tab === item.key;
              return (
                <button key={item.key} onClick={() => setTab(item.key)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative text-left w-full"
                  style={active ? {
                    background: "#EFF6FF", color: "#2563EB",
                    borderLeft: "3px solid #2563EB"
                  } : {
                    color: "#64748B", borderLeft: "3px solid transparent"
                  }}>
                  <ItemIcon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === "info" && <InfoTab equipo={equipo} />}
            {tab === "mantenimiento" && <MantenimientoTab equipo={equipo} actividades={actividades} user={user} onUpdated={reloadActividades} />}
            {tab === "inspecciones" && <InspeccionesTab equipo={equipo} actividades={actividades} user={user} onUpdated={reloadActividades} />}
            {tab === "parches" && <ParchesTab equipo={equipo} parches={parches} user={user} onUpdated={onActividadCreada} />}
            {tab === "repuestos" && <RepuestosTab equipo={equipo} />}
            {tab === "bitacora" && <BitacoraTab equipo={equipo} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   INFO TAB
────────────────────────────────────────────── */
function InfoTab({ equipo }) {
  const hoy = new Date();
  const batDias = equipo.fecha_vencimiento_bateria
    ? differenceInDays(parseISO(equipo.fecha_vencimiento_bateria), hoy)
    : null;

  const esAmbulancia = equipo.tipo === "ambulancia";

  const semaforo = (dias) => {
    if (dias === null) return null;
    if (dias < 0) return { color: "#EF4444", bg: "#FEF2F2", label: `Vencido hace ${Math.abs(dias)}d` };
    if (dias <= 30) return { color: "#EF4444", bg: "#FEF2F2", label: `Vence en ${dias}d` };
    if (dias <= 90) return { color: "#F59E0B", bg: "#FFFBEB", label: `Vence en ${dias}d` };
    return { color: "#10B981", bg: "#F0FDF4", label: `Vence en ${dias}d` };
  };

  return (
    <div className="space-y-6">
      {equipo.foto_url && (
        <img src={equipo.foto_url} alt="equipo" className="w-full h-44 object-cover rounded-2xl" style={{ border: "1px solid #E2E8F0" }} />
      )}

      {/* General */}
      <section>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Información General</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Centro", equipo.centro_principal],
            ["Subsede", equipo.subsede || "—"],
            ["Ubicación", equipo.ubicacion_especifica || "—"],
            ["Año Adquisición", equipo.anio_adquisicion || "—"],
            ...(equipo.numero_serie ? [["N° Serie", equipo.numero_serie]] : []),
            ...(equipo.responsable ? [["Responsable", equipo.responsable]] : []),
          ].map(([k, v]) => (
            <InfoCard key={k} label={k} value={v} />
          ))}
        </div>
      </section>

      {/* Batería (no ambulancia) */}
      {!esAmbulancia && equipo.fecha_vencimiento_bateria && (() => {
        const s = semaforo(batDias);
        return (
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Estado Batería</p>
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: s.bg, border: `1px solid ${s.color}33` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                  <Zap className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Batería Principal</p>
                  <p className="text-xs text-slate-500">Vence: {format(parseISO(equipo.fecha_vencimiento_bateria), "dd/MM/yyyy")}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ color: s.color, background: "white", border: `1px solid ${s.color}33` }}>
                {s.label}
              </span>
            </div>
          </section>
        );
      })()}

      {/* Ambulancia específico */}
      {esAmbulancia && (
        <>
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Documentación Legal</p>
            <div className="grid grid-cols-2 gap-3">
              <DocLegalCard
                label="Revisión Técnica"
                estado={equipo.estado_revision_tecnica}
                fechaVence={equipo.fecha_vencimiento_revision_tecnica}
              />
              <DocLegalCard
                label="Permiso de Circulación"
                estado={equipo.estado_permiso_circulacion}
                fechaVence={equipo.fecha_vencimiento_permiso_circulacion}
              />
            </div>
          </section>
          {equipo.patente && (
            <section>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Vehículo</p>
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Patente" value={equipo.patente} />
                {equipo.conductor_responsable && <InfoCard label="Conductor Responsable" value={equipo.conductor_responsable} />}
              </div>
            </section>
          )}
        </>
      )}

      {equipo.notas && (
        <section>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Notas</p>
          <div className="p-4 rounded-xl text-sm text-blue-800" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            {equipo.notas}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="p-3.5 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
      <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function DocLegalCard({ label, estado, fechaVence }) {
  const hoy = new Date();
  const dias = fechaVence ? differenceInDays(parseISO(fechaVence), hoy) : null;

  const getColor = () => {
    if (estado === "vencida" || estado === "vencido" || (dias !== null && dias < 0)) return "#EF4444";
    if (dias !== null && dias <= 30) return "#EF4444";
    if (dias !== null && dias <= 90) return "#F59E0B";
    if (estado === "ok") return "#10B981";
    if (estado === "en_gestion") return "#2563EB";
    return "#94A3B8";
  };

  const getLabel = () => {
    const labelMap = { ok: "Vigente", en_gestion: "En Gestión", pendiente: "Pendiente", vencida: "Vencida", vencido: "Vencido" };
    return labelMap[estado] || estado || "—";
  };

  const color = getColor();

  return (
    <div className="p-4 rounded-xl relative overflow-hidden" style={{ border: `1px solid ${color}33`, background: `${color}08` }}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl" style={{ background: color }} />
      <p className="text-xs font-medium mb-2 ml-1" style={{ color: "#64748B" }}>{label}</p>
      <span className="text-xs font-bold px-2.5 py-1 rounded-full ml-1" style={{ color, background: `${color}18` }}>
        {getLabel()}
      </span>
      {fechaVence && (
        <p className="text-xs text-slate-500 mt-2 ml-1 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {format(parseISO(fechaVence), "dd/MM/yyyy")}
          {dias !== null && <span className="font-medium" style={{ color }}>({dias < 0 ? `Venció hace ${Math.abs(dias)}d` : `${dias}d restantes`})</span>}
        </p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   MANTENIMIENTO TAB
────────────────────────────────────────────── */
function MantenimientoTab({ equipo, actividades, user, onUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: "mantenimiento_preventivo", fecha: new Date().toISOString().split("T")[0], observaciones: "", usuario_nombre: user?.full_name || "" });
  const [saving, setSaving] = useState(false);

  const mantenimientos = actividades.filter(a => ["mantenimiento_preventivo", "mantenimiento_correctivo", "cambio_parches"].includes(a.tipo))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Actividad.create({ ...form, equipo_id: equipo.id });
    setSaving(false);
    setShowForm(false);
    onUpdated();
  };

  const tipoLabel = { mantenimiento_preventivo: "Mantenimiento Preventivo", mantenimiento_correctivo: "Mantenimiento Correctivo", cambio_parches: "Cambio de Parches" };
  const tipoColor = { mantenimiento_preventivo: "#2563EB", mantenimiento_correctivo: "#EF4444", cambio_parches: "#10B981" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">Historial de Mantenimiento</h3>
          <p className="text-xs text-slate-400 mt-0.5">{mantenimientos.length} registro(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "#2563EB" }}>
          <Plus className="w-3.5 h-3.5" /> Registrar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="p-4 rounded-2xl space-y-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nueva Entrada</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
              <select className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="mantenimiento_preventivo">Mantenimiento Preventivo</option>
                <option value="mantenimiento_correctivo">Mantenimiento Correctivo</option>
                <option value="cambio_parches">Cambio de Parches</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Fecha</label>
              <input type="date" required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Responsable</label>
            <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ borderColor: "#E2E8F0" }}
              placeholder="Nombre del técnico/responsable"
              value={form.usuario_nombre} onChange={e => setForm(f => ({ ...f, usuario_nombre: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Observaciones</label>
            <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              style={{ borderColor: "#E2E8F0" }}
              value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#2563EB" }}>
              {saving ? "Guardando..." : "Guardar Registro"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Revisión Anual */}
      <div className="p-4 rounded-2xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">Revisión Anual</p>
            <p className="text-sm font-semibold text-slate-800">Próxima revisión programada</p>
            <p className="text-xs text-slate-500 mt-0.5">Cargar certificado o informe técnico</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
            style={{ border: "1px solid #86EFAC" }}>
            <Upload className="w-3.5 h-3.5" /> Cargar
          </button>
        </div>
      </div>

      {/* History list */}
      {mantenimientos.length === 0 ? (
        <EmptyState icon={Wrench} text="Sin registros de mantenimiento" />
      ) : (
        <div className="space-y-2.5">
          {mantenimientos.map(act => (
            <ActivityCard key={act.id} act={act} tipoLabel={tipoLabel} tipoColor={tipoColor} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   INSPECCIONES TAB
────────────────────────────────────────────── */
function InspeccionesTab({ equipo, actividades, user, onUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: "inspeccion", fecha: new Date().toISOString().split("T")[0], observaciones: "", usuario_nombre: user?.full_name || "" });
  const [saving, setSaving] = useState(false);

  const inspecciones = actividades.filter(a => a.tipo === "inspeccion" || a.tipo === "error_calibracion")
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Actividad.create({ ...form, equipo_id: equipo.id });
    setSaving(false);
    setShowForm(false);
    onUpdated();
  };

  const tipoLabel = { inspeccion: "Inspección", error_calibracion: "Error de Calibración" };
  const tipoColor = { inspeccion: "#2563EB", error_calibracion: "#EF4444" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">Historial de Inspecciones</h3>
          <p className="text-xs text-slate-400 mt-0.5">{inspecciones.length} registro(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "#2563EB" }}>
          <Plus className="w-3.5 h-3.5" /> Registrar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="p-4 rounded-2xl space-y-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nueva Inspección</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
              <select className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="inspeccion">Inspección</option>
                <option value="error_calibracion">Error de Calibración</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Fecha</label>
              <input type="date" required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Responsable (Técnico Biomédico)</label>
            <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              style={{ borderColor: "#E2E8F0" }}
              value={form.usuario_nombre} onChange={e => setForm(f => ({ ...f, usuario_nombre: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Observaciones</label>
            <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
              style={{ borderColor: "#E2E8F0" }}
              value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#2563EB" }}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Certificación Anual destacada */}
      <div className="p-4 rounded-2xl" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1">Certificación Anual</p>
            <p className="text-sm font-semibold text-slate-800">Documentos técnicos certificados</p>
            <p className="text-xs text-slate-500 mt-0.5">Cargar certificado oficial del fabricante o taller</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            style={{ border: "1px solid #93C5FD" }}>
            <Upload className="w-3.5 h-3.5" /> Cargar
          </button>
        </div>
      </div>

      {inspecciones.length === 0 ? (
        <EmptyState icon={ClipboardCheck} text="Sin registros de inspección" />
      ) : (
        <div className="space-y-2.5">
          {inspecciones.map(act => (
            <ActivityCard key={act.id} act={act} tipoLabel={tipoLabel} tipoColor={tipoColor} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   PARCHES TAB
────────────────────────────────────────────── */
function ParchesTab({ equipo, parches, user, onUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: "adulto", cantidad: 1, lote: "", fecha_adquisicion: "", fecha_vencimiento: "" });
  const [saving, setSaving] = useState(false);
  const hoy = new Date();

  const TIPO_LABELS = { adulto: "Adulto", pediatrico: "Pediátrico", mixto: "Mixto" };
  const TIPO_DOT_COLORS = { adulto: "#2563EB", pediatrico: "#9333EA", mixto: "#059669" };

  const getStyle = (p) => {
    const dias = differenceInDays(parseISO(p.fecha_vencimiento), hoy);
    if (dias < 0) return { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626", label: "VENCIDO" };
    if (dias <= 30) return { bg: "#FFF7ED", border: "#FDBA74", text: "#EA580C", label: `${dias}d` };
    if (dias <= 90) return { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", label: `${dias}d` };
    return { bg: "#F0FDF4", border: "#86EFAC", text: "#16A34A", label: `${dias}d` };
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Parche.create({ ...form, equipo_id: equipo.id, cantidad: Number(form.cantidad), activo: true });
    setSaving(false);
    setShowForm(false);
    onUpdated && onUpdated();
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este parche?")) return;
    await base44.entities.Parche.delete(id);
    onUpdated && onUpdated();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">Parches Registrados</h3>
          <p className="text-xs text-slate-400 mt-0.5">{parches.length} parche(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#2563EB" }}>
          <Plus className="w-3.5 h-3.5" /> Agregar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="p-4 rounded-2xl space-y-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Tipo *</label>
              <select required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="adulto">Adulto</option>
                <option value="pediatrico">Pediátrico</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Cantidad *</label>
              <input type="number" required min="1" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Vencimiento *</label>
              <input type="date" required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                value={form.fecha_vencimiento} onChange={e => setForm(f => ({ ...f, fecha_vencimiento: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Lote</label>
              <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                value={form.lote} onChange={e => setForm(f => ({ ...f, lote: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#2563EB" }}>
              {saving ? "Guardando..." : "Agregar Parche"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {parches.length === 0 ? (
        <EmptyState icon={Package} text="No hay parches registrados" />
      ) : (
        <div className="space-y-2.5">
          {parches.map(p => {
            const s = getStyle(p);
            return (
              <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TIPO_DOT_COLORS[p.tipo] }} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {TIPO_LABELS[p.tipo]} — {p.cantidad} ud{p.cantidad > 1 ? "s" : ""}
                      {p.lote && <span className="text-slate-400 font-normal"> · Lote {p.lote}</span>}
                    </p>
                    <p className="text-xs text-slate-500">Vence: {format(parseISO(p.fecha_vencimiento), "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: s.text, background: "white", border: `1px solid ${s.border}` }}>
                    {s.label}
                  </span>
                  <button onClick={() => handleDelete(p.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   REPUESTOS TAB (ambulancia)
────────────────────────────────────────────── */
function RepuestosTab({ equipo }) {
  const piezas = [
    { key: "estado_neumaticos", label: "Neumáticos", icon: "🛞" },
    { key: "estado_luces", label: "Luces", icon: "💡" },
    { key: "estado_bateria_vehiculo", label: "Batería Vehículo", icon: "🔋" },
    { key: "estado_sirena", label: "Sirena", icon: "🚨" },
  ];

  const getConfig = (val) => {
    const map = {
      ok: { color: "#10B981", bg: "#F0FDF4", bar: 100, label: "OK" },
      desgastado: { color: "#F59E0B", bg: "#FFFBEB", bar: 50, label: "Desgastado" },
      baja_carga: { color: "#F59E0B", bg: "#FFFBEB", bar: 40, label: "Baja Carga" },
      falla_leve: { color: "#F59E0B", bg: "#FFFBEB", bar: 60, label: "Falla Leve" },
      requiere_cambio: { color: "#EF4444", bg: "#FEF2F2", bar: 15, label: "Requiere Cambio" },
      requiere_reemplazo: { color: "#EF4444", bg: "#FEF2F2", bar: 10, label: "Reemplazar" },
      falla_grave: { color: "#EF4444", bg: "#FEF2F2", bar: 5, label: "Falla Grave" },
    };
    return map[val] || { color: "#94A3B8", bg: "#F8FAFC", bar: 0, label: val || "Sin datos" };
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-slate-900">Estado de Piezas Críticas</h3>
        <p className="text-xs text-slate-400 mt-0.5">Monitoreo de componentes principales del vehículo</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {piezas.map(({ key, label, icon }) => {
          const val = equipo[key];
          const cfg = getConfig(val);
          return (
            <div key={key} className="p-4 rounded-2xl" style={{ background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{icon}</span>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ color: cfg.color, background: "white", border: `1px solid ${cfg.color}33` }}>
                  {cfg.label}
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "#E2E8F0" }}>
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${cfg.bar}%`, background: cfg.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   BITÁCORA TAB (ambulancia)
────────────────────────────────────────────── */
function BitacoraTab({ equipo }) {
  const [registros, setRegistros] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fecha: new Date().toISOString().split("T")[0], conductor: "", km_inicial: "", observaciones: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Kilometraje.filter({ equipo_id: equipo.id })
      .then(data => setRegistros(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))))
      .catch(() => {});
  }, [equipo.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const kmInicial = Number(form.km_inicial);

    // Cerrar el registro activo (sin km_final) si existe
    const registroActivo = registros.find(r => !r.km_final);
    if (registroActivo) {
      await base44.entities.Kilometraje.update(registroActivo.id, {
        km_final: kmInicial > 0 ? kmInicial - 1 : kmInicial
      });
    }

    // Crear nuevo registro
    await base44.entities.Kilometraje.create({
      equipo_id: equipo.id,
      fecha: form.fecha,
      conductor: form.conductor,
      valor_km: kmInicial,
      km_inicial: kmInicial,
      observaciones: form.observaciones
    });

    const updated = await base44.entities.Kilometraje.filter({ equipo_id: equipo.id });
    setRegistros(updated.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    setShowForm(false);
    setSaving(false);
    setForm({ fecha: new Date().toISOString().split("T")[0], conductor: "", km_inicial: "", observaciones: "" });
  };

  const registroActivo = registros.find(r => !r.km_final);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900">Bitácora de Conductores</h3>
          <p className="text-xs text-slate-400 mt-0.5">Historial de asignaciones y kilometraje</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#2563EB" }}>
          <Plus className="w-3.5 h-3.5" /> Nuevo Conductor
        </button>
      </div>

      {/* Conductor activo */}
      {registroActivo && (
        <div className="p-4 rounded-2xl" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Conductor Actual</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{registroActivo.conductor || "Sin nombre"}</p>
              <p className="text-xs text-slate-500">
                Desde {registroActivo.fecha} · KM inicial: <strong>{(registroActivo.km_inicial || registroActivo.valor_km)?.toLocaleString()}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="p-4 rounded-2xl space-y-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Asignar Nuevo Conductor</p>
          {registroActivo && (
            <div className="flex items-center gap-2 text-xs text-amber-700 p-2.5 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Se cerrará automáticamente el registro de <strong className="mx-1">{registroActivo.conductor}</strong> con KM final = KM inicial ingresado − 1
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Conductor *</label>
              <input required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                placeholder="Nombre del conductor"
                value={form.conductor} onChange={e => setForm(f => ({ ...f, conductor: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">KM Inicial *</label>
              <input type="number" required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                value={form.km_inicial} onChange={e => setForm(f => ({ ...f, km_inicial: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Fecha</label>
              <input type="date" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#E2E8F0" }}
                value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#2563EB" }}>
              {saving ? "Guardando..." : "Confirmar Asignación"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {registros.length === 0 ? (
        <EmptyState icon={BookOpen} text="Sin registros en la bitácora" />
      ) : (
        <div className="space-y-2.5">
          {registros.map((r, idx) => {
            const isActive = !r.km_final;
            return (
              <div key={r.id} className="p-3.5 rounded-xl flex items-center justify-between"
                style={{
                  background: isActive ? "#EFF6FF" : "#F8FAFC",
                  border: `1px solid ${isActive ? "#BFDBFE" : "#E2E8F0"}`
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: isActive ? "#DBEAFE" : "#E2E8F0" }}>
                    <User className="w-4 h-4" style={{ color: isActive ? "#2563EB" : "#94A3B8" }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{r.conductor || "Sin nombre"}</p>
                      {isActive && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#DBEAFE", color: "#2563EB" }}>ACTIVO</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.fecha} · KM inicial: <strong>{(r.km_inicial || r.valor_km)?.toLocaleString()}</strong>
                      {r.km_final && <> · KM final: <strong>{r.km_final?.toLocaleString()}</strong></>}
                    </p>
                  </div>
                </div>
                {r.km_final && (
                  <span className="text-xs font-semibold text-slate-500">
                    {(r.km_final - (r.km_inicial || r.valor_km))?.toLocaleString()} km
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Shared helpers ── */
function ActivityCard({ act, tipoLabel, tipoColor }) {
  const color = tipoColor[act.tipo] || "#64748B";
  const label = tipoLabel[act.tipo] || act.tipo;
  return (
    <div className="p-3.5 rounded-xl flex items-start gap-3" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          <span className="text-xs text-slate-400">{act.fecha}</span>
        </div>
        {act.observaciones && <p className="text-xs text-slate-500 mt-1">{act.observaciones}</p>}
        {act.usuario_nombre && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <User className="w-3 h-3" />{act.usuario_nombre}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="py-14 flex flex-col items-center gap-3">
      <Icon className="w-10 h-10 text-slate-200" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
}