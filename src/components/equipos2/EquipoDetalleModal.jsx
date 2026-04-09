import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, Edit, Trash2, Plus, Info, Wrench, ClipboardCheck, Package, BookOpen,
  MapPin, Calendar, User, Upload, AlertTriangle, Activity, Car, Zap, Monitor,
  Hash, Gauge, FileText, Download, Shield, CheckCircle, Clock, ArrowLeft,
  Loader2, ExternalLink
} from "lucide-react";
import { TIPOS_EQUIPO, ESTADOS_EQUIPO, TIPOS_ACTIVIDAD } from "@/lib/centros";
import RepuestosTab from "./RepuestosTab";
import { format, parseISO, differenceInDays } from "date-fns";

const TIPO_ICONS = { dea: Zap, monitor_desfibrilador: Activity, ambulancia: Car, monitor_multiparametros: Monitor };

export default function EquipoDetalleModal({ equipo, parches, onClose, onEdit, onDeleted, user, onActividadCreada }) {
  const [actividades, setActividades] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState("info");

  const isAdmin = user?.role === "admin";
  const estado = ESTADOS_EQUIPO.find(e => e.value === equipo.estado) || ESTADOS_EQUIPO[0];
  const tipoLabel = TIPOS_EQUIPO.find(t => t.value === equipo.tipo)?.label || equipo.tipo;
  const Icon = TIPO_ICONS[equipo.tipo] || Monitor;
  const esAmbulancia = equipo.tipo === "ambulancia";

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

  const estadoColor = { operativo: "#10B981", mantenimiento: "#F59E0B", fuera_de_servicio: "#EF4444" }[equipo.estado] || "#94A3B8";
  const estadoBg = { operativo: "#ECFDF5", mantenimiento: "#FFFBEB", fuera_de_servicio: "#FEF2F2" }[equipo.estado] || "#F8FAFC";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden"
        style={{ borderRadius: "20px", boxShadow: "0 24px 60px rgba(0,0,0,0.22)" }}>

        {/* ── TOP HEADER ── */}
        <div style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #1D4ED8 100%)", borderRadius: "20px 20px 0 0" }}>
          <div className="px-6 pt-5 pb-4">
            {/* breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-blue-300 mb-3">
              <span>Equipos</span>
              <span>›</span>
              <span className="text-white font-medium">{tipoLabel}</span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                    style={{ background: estadoBg, color: estadoColor }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: estadoColor }} />
                    {estado.label}
                  </span>
                  {equipo.patente && (
                    <span className="text-xs text-blue-200 font-medium">Patente: {equipo.patente}</span>
                  )}
                  <span className="text-xs text-blue-300 flex items-center gap-1">
                    <Hash className="w-3 h-3" />{equipo.numero_inventario}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.03em" }}>
                  {tipoLabel} — {equipo.marca} {equipo.modelo}
                </h2>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button onClick={onEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:bg-white/20"
                  style={{ border: "1px solid rgba(255,255,255,0.3)" }}>
                  <Edit className="w-3.5 h-3.5" /> Editar
                </button>
                {isAdmin && (
                  <button onClick={handleDelete} disabled={deleting}
                    className="px-3 py-2 rounded-xl text-sm font-semibold text-red-300 hover:bg-red-900/30 transition-all"
                    style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-blue-300 hover:bg-white/10 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nav tabs */}
            <div className="flex gap-1 mt-4">
              {navItems.map(item => {
                const ItemIcon = item.icon;
                const active = tab === item.key;
                return (
                  <button key={item.key} onClick={() => setTab(item.key)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-medium transition-all"
                    style={active
                      ? { background: "white", color: "#1D4ED8" }
                      : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                    <ItemIcon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto" style={{ background: "#F8FAFC" }}>
          <div className="p-6">
            {tab === "info" && <InfoTab equipo={equipo} />}
            {tab === "mantenimiento" && <MantenimientoTab equipo={equipo} actividades={actividades} user={user} onUpdated={reloadActividades} />}
            {tab === "inspecciones" && <InspeccionesTab equipo={equipo} actividades={actividades} user={user} onUpdated={reloadActividades} />}
            {tab === "parches" && <ParchesTab equipo={equipo} parches={parches} user={user} onUpdated={onActividadCreada} />}
            {tab === "repuestos" && <RepuestosTab equipo={equipo} user={user} />}
            {tab === "bitacora" && <BitacoraTab equipo={equipo} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   INFO TAB
══════════════════════════════════════════════ */
function InfoTab({ equipo }) {
  const hoy = new Date();
  const esAmbulancia = equipo.tipo === "ambulancia";

  const semaforoDoc = (estado, fechaVence) => {
    if (!estado && !fechaVence) return { color: "#94A3B8", bg: "#F8FAFC", label: "Sin datos", barColor: "#CBD5E1" };
    const dias = fechaVence ? differenceInDays(parseISO(fechaVence), hoy) : null;
    if (estado === "vencida" || estado === "vencido" || (dias !== null && dias < 0))
      return { color: "#EF4444", bg: "#FEF2F2", label: "Vencido", barColor: "#EF4444" };
    if (dias !== null && dias <= 30) return { color: "#EF4444", bg: "#FEF2F2", label: `${dias}d restantes`, barColor: "#EF4444" };
    if (dias !== null && dias <= 90) return { color: "#F59E0B", bg: "#FFFBEB", label: `${dias}d restantes`, barColor: "#F59E0B" };
    if (estado === "en_gestion") return { color: "#2563EB", bg: "#EFF6FF", label: "En Gestión", barColor: "#2563EB" };
    return { color: "#10B981", bg: "#ECFDF5", label: "Al día", barColor: "#10B981" };
  };

  const batDias = equipo.fecha_vencimiento_bateria
    ? differenceInDays(parseISO(equipo.fecha_vencimiento_bateria), hoy)
    : null;

  return (
    <div className="space-y-5">
      {/* Image + location row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Image */}
        <div className="md:col-span-3 relative rounded-2xl overflow-hidden bg-slate-200"
          style={{ minHeight: 200, border: "1px solid #E2E8F0" }}>
          {equipo.foto_url ? (
            <img src={equipo.foto_url} alt="equipo" className="w-full h-full object-cover" style={{ minHeight: 200 }} />
          ) : (
            <div className="w-full flex items-center justify-center" style={{ minHeight: 200, background: "linear-gradient(135deg,#EFF6FF,#E0E7FF)" }}>
              <div className="text-center">
                {equipo.tipo === "ambulancia" ? <Car className="w-16 h-16 text-blue-200 mx-auto mb-2" /> : <Monitor className="w-16 h-16 text-blue-200 mx-auto mb-2" />}
                <p className="text-xs text-slate-400">Sin imagen registrada</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
            <p className="text-xs text-white/70 uppercase tracking-widest mb-0.5">Registro Visual</p>
            <p className="text-white font-bold">{equipo.marca} {equipo.modelo}</p>
          </div>
        </div>

        {/* Right column */}
        <div className="md:col-span-2 flex flex-col gap-3">
          {/* Marca & modelo */}
          <div className="bg-white rounded-2xl p-4 flex-1" style={{ border: "1px solid #E2E8F0" }}>
            <div className="mb-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Marca</p>
              <p className="text-xl font-bold text-slate-900">{equipo.marca}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Modelo</p>
              <p className="text-xl font-bold text-slate-900">{equipo.modelo}</p>
            </div>
          </div>

          {/* Location card */}
          <div className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-20" style={{ background: "white" }} />
            <p className="text-xs text-blue-200 uppercase tracking-widest mb-1">Ubicación Actual</p>
            <p className="text-white font-bold text-base leading-tight">
              {equipo.centro_principal}
              {equipo.subsede && <span className="block text-blue-200 text-sm font-medium">{equipo.subsede}</span>}
            </p>
            {equipo.ubicacion_especifica && (
              <p className="text-blue-200 text-xs mt-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{equipo.ubicacion_especifica}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Legal docs (ambulancia) */}
      {esAmbulancia && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Permiso de Circulación", icon: Shield, estado: equipo.estado_permiso_circulacion, fecha: equipo.fecha_vencimiento_permiso_circulacion },
            { label: "Revisión Técnica", icon: CheckCircle, estado: equipo.estado_revision_tecnica, fecha: equipo.fecha_vencimiento_revision_tecnica }
          ].map(({ label, icon: DIcon, estado, fecha }) => {
            const s = semaforoDoc(estado, fecha);
            const dias = fecha ? differenceInDays(parseISO(fecha), hoy) : null;
            const stateLabel = { ok: "Validado", en_gestion: "Agendada", pendiente: "Pendiente", vencida: "Vencida", vencido: "Vencido" }[estado] || estado || "—";
            return (
              <div key={label} className="bg-white rounded-2xl p-5 relative overflow-hidden"
                style={{ border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: s.barColor }} />
                <div className="flex items-start justify-between mb-3 ml-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <DIcon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>
                    {s.label}
                  </span>
                </div>
                <p className="font-semibold text-slate-800 ml-2 mb-3">{label}</p>
                <div className="grid grid-cols-2 gap-2 ml-2">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">Estado</p>
                    <p className="text-sm font-semibold text-slate-700">{stateLabel}</p>
                  </div>
                  {fecha && (
                    <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest mb-0.5">Vencimiento</p>
                      <p className="text-sm font-semibold" style={{ color: dias !== null && dias < 30 ? s.color : "#1E293B" }}>
                        {format(parseISO(fecha), "dd/MM/yyyy")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* General info grid */}
      <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Datos del Equipo</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            ["N° Serie", equipo.numero_serie],
            ["Año Adquisición", equipo.anio_adquisicion],
            ["Responsable", equipo.responsable || equipo.conductor_responsable],
            ...(batDias !== null ? [["Batería vence", format(parseISO(equipo.fecha_vencimiento_bateria), "dd/MM/yyyy")]] : []),
            ...(equipo.patente ? [["Patente", equipo.patente]] : [])
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="p-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <p className="text-xs font-medium text-slate-400 mb-0.5">{k}</p>
              <p className="text-sm font-semibold text-slate-800">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Battery alert */}
      {batDias !== null && batDias <= 90 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: batDias < 0 ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${batDias < 0 ? "#FECACA" : "#FDE68A"}` }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: batDias < 0 ? "#EF4444" : "#F59E0B" }} />
          <p className="text-sm font-medium" style={{ color: batDias < 0 ? "#DC2626" : "#B45309" }}>
            Batería {batDias < 0 ? `vencida hace ${Math.abs(batDias)} días` : `vence en ${batDias} días`}
          </p>
        </div>
      )}

      {equipo.notas && (
        <div className="p-4 rounded-2xl text-sm text-blue-800" style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Notas</p>
          {equipo.notas}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MANTENIMIENTO TAB
══════════════════════════════════════════════ */
function MantenimientoTab({ equipo, actividades, user, onUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: "mantenimiento_preventivo", fecha: new Date().toISOString().split("T")[0], observaciones: "", usuario_nombre: user?.full_name || "" });
  const [saving, setSaving] = useState(false);

  const mantenimientos = actividades
    .filter(a => ["mantenimiento_preventivo", "mantenimiento_correctivo", "cambio_parches"].includes(a.tipo))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const tipoLabel = { mantenimiento_preventivo: "Mantenimiento Preventivo", mantenimiento_correctivo: "Mantenimiento Correctivo", cambio_parches: "Cambio de Parches" };
  const tipoColor = { mantenimiento_preventivo: "#2563EB", mantenimiento_correctivo: "#EF4444", cambio_parches: "#10B981" };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Actividad.create({ ...form, equipo_id: equipo.id });
    setSaving(false);
    setShowForm(false);
    onUpdated();
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Historial de Mantenimiento" count={mantenimientos.length} onAdd={() => setShowForm(!showForm)} />

      {showForm && (
        <ActividadForm
          form={form} setForm={setForm} saving={saving} onSave={handleSave} onCancel={() => setShowForm(false)}
          tipoOptions={[
            { value: "mantenimiento_preventivo", label: "Mantenimiento Preventivo" },
            { value: "mantenimiento_correctivo", label: "Mantenimiento Correctivo" },
            { value: "cambio_parches", label: "Cambio de Parches" }
          ]}
        />
      )}

      {/* Revisión Anual */}
      <div className="bg-white p-4 rounded-2xl" style={{ border: "1px solid #BBF7D0" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Revisión Anual</p>
            <p className="text-sm font-semibold text-slate-800">Próxima revisión programada</p>
            <p className="text-xs text-slate-400 mt-0.5">Informe técnico o certificado biomédico</p>
          </div>
          <FileUploadButton label="Cargar Informe" color="#10B981" />
        </div>
      </div>

      {mantenimientos.length === 0
        ? <EmptyState icon={Wrench} text="Sin registros de mantenimiento" />
        : mantenimientos.map(act => <ActivityCard key={act.id} act={act} tipoLabel={tipoLabel} tipoColor={tipoColor} />)
      }
    </div>
  );
}

/* ══════════════════════════════════════════════
   INSPECCIONES TAB
══════════════════════════════════════════════ */
function InspeccionesTab({ equipo, actividades, user, onUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tipo: "inspeccion",
    fecha: new Date().toISOString().split("T")[0],
    observaciones: "",
    usuario_nombre: user?.full_name || "",
    archivo_url: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const inspecciones = actividades
    .filter(a => ["inspeccion", "error_calibracion"].includes(a.tipo))
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const tipoLabel = { inspeccion: "Inspección", error_calibracion: "Error de Calibración" };
  const tipoColor = { inspeccion: "#2563EB", error_calibracion: "#EF4444" };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, archivo_url: file_url }));
    setUploading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Actividad.create({ ...form, equipo_id: equipo.id });
    setSaving(false);
    setShowForm(false);
    setForm(f => ({ ...f, archivo_url: "" }));
    onUpdated();
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Historial de Inspecciones" count={inspecciones.length} onAdd={() => setShowForm(!showForm)} />

      {showForm && (
        <div className="bg-white p-5 rounded-2xl space-y-4" style={{ border: "1px solid #E2E8F0" }}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nueva Inspección</p>
          <form onSubmit={handleSave} className="space-y-3">
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

            {/* File upload */}
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Adjuntar Documento (PDF, Word)</label>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden" onChange={handleFile} />
              {form.archivo_url ? (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs text-green-700 font-medium flex-1">Archivo cargado correctamente</span>
                  <a href={form.archivo_url} target="_blank" rel="noreferrer"
                    className="text-xs text-green-700 underline flex items-center gap-1">
                    Ver <ExternalLink className="w-3 h-3" />
                  </a>
                  <button type="button" onClick={() => setForm(f => ({ ...f, archivo_url: "" }))}
                    className="text-slate-400 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all hover:border-blue-400"
                  style={{ border: "2px dashed #CBD5E1", color: "#64748B", background: "#F8FAFC" }}>
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</> : <><Upload className="w-4 h-4" /> Seleccionar PDF o Word</>}
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving || uploading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#2563EB" }}>
                {saving ? "Guardando..." : "Guardar Inspección"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(f => ({ ...f, archivo_url: "" })); }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Certificación Anual */}
      <div className="bg-white p-4 rounded-2xl" style={{ border: "1px solid #BFDBFE" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Certificación Anual</p>
            <p className="text-sm font-semibold text-slate-800">Documentos técnicos certificados</p>
            <p className="text-xs text-slate-400 mt-0.5">Certificado oficial del fabricante o taller autorizado</p>
          </div>
          <FileUploadButton label="Cargar Certificado" color="#2563EB" />
        </div>
      </div>

      {inspecciones.length === 0
        ? <EmptyState icon={ClipboardCheck} text="Sin registros de inspección" />
        : inspecciones.map(act => (
          <ActivityCard key={act.id} act={act} tipoLabel={tipoLabel} tipoColor={tipoColor} showArchivo />
        ))
      }
    </div>
  );
}

/* ══════════════════════════════════════════════
   PARCHES TAB
══════════════════════════════════════════════ */
function ParchesTab({ equipo, parches, user, onUpdated }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: "adulto", cantidad: 1, lote: "", fecha_adquisicion: "", fecha_vencimiento: "" });
  const [saving, setSaving] = useState(false);
  const hoy = new Date();

  const TIPO_LABELS = { adulto: "Adulto", pediatrico: "Pediátrico", mixto: "Mixto" };
  const TIPO_DOT = { adulto: "#2563EB", pediatrico: "#9333EA", mixto: "#059669" };

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
      <SectionHeader title="Parches Registrados" count={parches.length} onAdd={() => setShowForm(!showForm)} addLabel="Agregar" />
      {showForm && (
        <div className="bg-white p-5 rounded-2xl space-y-3" style={{ border: "1px solid #E2E8F0" }}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Tipo *", el: <select required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}><option value="adulto">Adulto</option><option value="pediatrico">Pediátrico</option><option value="mixto">Mixto</option></select> },
                { label: "Cantidad *", el: <input type="number" required min="1" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} /> },
                { label: "Vencimiento *", el: <input type="date" required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} value={form.fecha_vencimiento} onChange={e => setForm(f => ({ ...f, fecha_vencimiento: e.target.value }))} /> },
                { label: "Lote", el: <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} value={form.lote} onChange={e => setForm(f => ({ ...f, lote: e.target.value }))} /> }
              ].map(({ label, el }) => (
                <div key={label}>
                  <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
                  {el}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#2563EB" }}>
                {saving ? "Guardando..." : "Agregar Parche"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
            </div>
          </form>
        </div>
      )}
      {parches.length === 0 ? <EmptyState icon={Package} text="No hay parches registrados" /> : (
        <div className="space-y-2.5">
          {parches.map(p => {
            const s = getStyle(p);
            return (
              <div key={p.id} className="bg-white flex items-center justify-between p-4 rounded-xl"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: TIPO_DOT[p.tipo] }} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{TIPO_LABELS[p.tipo]} — {p.cantidad} ud{p.cantidad > 1 ? "s" : ""}{p.lote && <span className="text-slate-400 font-normal"> · Lote {p.lote}</span>}</p>
                    <p className="text-xs text-slate-500">Vence: {format(parseISO(p.fecha_vencimiento), "dd/MM/yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: s.text, background: "white", border: `1px solid ${s.border}` }}>{s.label}</span>
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

/* ══════════════════════════════════════════════
   BITÁCORA TAB
══════════════════════════════════════════════ */
function BitacoraTab({ equipo }) {
  const [registros, setRegistros] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fecha: new Date().toISOString().split("T")[0], conductor: "", km_inicial: "", observaciones: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Kilometraje.filter({ equipo_id: equipo.id })
      .then(d => setRegistros(d.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))))
      .catch(() => {});
  }, [equipo.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const kmInicial = Number(form.km_inicial);
    const activo = registros.find(r => !r.km_final);
    if (activo) await base44.entities.Kilometraje.update(activo.id, { km_final: kmInicial > 0 ? kmInicial - 1 : kmInicial });
    await base44.entities.Kilometraje.create({ equipo_id: equipo.id, fecha: form.fecha, conductor: form.conductor, valor_km: kmInicial, km_inicial: kmInicial, observaciones: form.observaciones });
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
        <div><h3 className="font-bold text-slate-900">Bitácora de Conductores</h3><p className="text-xs text-slate-400 mt-0.5">Historial de asignaciones y kilometraje</p></div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#2563EB" }}>
          <Plus className="w-3.5 h-3.5" /> Nuevo Conductor
        </button>
      </div>

      {registroActivo && (
        <div className="p-4 rounded-2xl" style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", border: "1px solid #BFDBFE" }}>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Conductor Actual</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}><User className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="font-bold text-slate-900">{registroActivo.conductor || "Sin nombre"}</p>
              <p className="text-xs text-slate-500">Desde {registroActivo.fecha} · KM inicial: <strong>{(registroActivo.km_inicial || registroActivo.valor_km)?.toLocaleString()}</strong></p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl space-y-3" style={{ border: "1px solid #E2E8F0" }}>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asignar Nuevo Conductor</p>
          {registroActivo && (
            <div className="flex items-center gap-2 text-xs p-3 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#B45309" }}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Se cerrará automáticamente el registro de <strong className="mx-1">{registroActivo.conductor}</strong> con KM final = KM inicial − 1
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Conductor *</label>
              <input required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} placeholder="Nombre del conductor" value={form.conductor} onChange={e => setForm(f => ({ ...f, conductor: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">KM Inicial *</label>
              <input type="number" required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} value={form.km_inicial} onChange={e => setForm(f => ({ ...f, km_inicial: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Fecha</label>
              <input type="date" className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }} value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#2563EB" }}>{saving ? "Guardando..." : "Confirmar Asignación"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
          </div>
        </form>
      )}

      {registros.length === 0 ? <EmptyState icon={BookOpen} text="Sin registros en la bitácora" /> : (
        <div className="space-y-2.5">
          {registros.map(r => {
            const isActive = !r.km_final;
            return (
              <div key={r.id} className="bg-white p-3.5 rounded-xl flex items-center justify-between"
                style={{ border: `1px solid ${isActive ? "#BFDBFE" : "#E2E8F0"}`, background: isActive ? "#F0F9FF" : "white" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: isActive ? "#DBEAFE" : "#F1F5F9" }}>
                    <User className="w-4 h-4" style={{ color: isActive ? "#2563EB" : "#94A3B8" }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{r.conductor || "Sin nombre"}</p>
                      {isActive && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#DBEAFE", color: "#2563EB" }}>ACTIVO</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{r.fecha} · KM inicial: <strong>{(r.km_inicial || r.valor_km)?.toLocaleString()}</strong>{r.km_final && <> · KM final: <strong>{r.km_final?.toLocaleString()}</strong></>}</p>
                  </div>
                </div>
                {r.km_final && <span className="text-xs font-semibold text-slate-500">{(r.km_final - (r.km_inicial || r.valor_km))?.toLocaleString()} km</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Shared helpers ── */
function SectionHeader({ title, count, onAdd, addLabel = "Registrar" }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{count} registro(s)</p>
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: "#2563EB" }}>
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  );
}

function ActividadForm({ form, setForm, saving, onSave, onCancel, tipoOptions }) {
  return (
    <div className="bg-white p-5 rounded-2xl space-y-3" style={{ border: "1px solid #E2E8F0" }}>
      <form onSubmit={onSave} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Tipo</label>
            <select className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }}
              value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {tipoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Fecha</label>
            <input type="date" required className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }}
              value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Responsable</label>
          <input className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: "#E2E8F0" }}
            value={form.usuario_nombre} onChange={e => setForm(f => ({ ...f, usuario_nombre: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Observaciones</label>
          <textarea rows={2} className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" style={{ borderColor: "#E2E8F0" }}
            value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#2563EB" }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

function FileUploadButton({ label, color }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUrl(file_url);
    setUploading(false);
  };

  return (
    <>
      <input ref={ref} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />
      {url ? (
        <a href={url} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ color, border: `1px solid ${color}44`, background: `${color}10` }}>
          <ExternalLink className="w-3.5 h-3.5" /> Ver archivo
        </a>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ color, border: `1px solid ${color}44`, background: `${color}10` }}>
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? "Subiendo..." : label}
        </button>
      )}
    </>
  );
}

function ActivityCard({ act, tipoLabel, tipoColor, showArchivo }) {
  const color = tipoColor[act.tipo] || "#64748B";
  const label = tipoLabel[act.tipo] || act.tipo;
  return (
    <div className="bg-white p-4 rounded-xl flex items-start gap-3" style={{ border: "1px solid #E2E8F0" }}>
      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          <span className="text-xs text-slate-400">{act.fecha}</span>
        </div>
        {act.observaciones && <p className="text-xs text-slate-500 mt-1">{act.observaciones}</p>}
        {act.usuario_nombre && <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><User className="w-3 h-3" />{act.usuario_nombre}</p>}
        {showArchivo && act.archivo_url && (
          <a href={act.archivo_url} target="_blank" rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
            <FileText className="w-3 h-3" /> Ver documento adjunto
          </a>
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