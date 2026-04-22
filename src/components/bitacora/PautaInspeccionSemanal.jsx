import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp,
  Send, Fuel, Car, Zap, Wrench, Package, FileText
} from "lucide-react";

const NIVEL_COMBUSTIBLE = ["E", "1/4", "1/2", "3/4", "F"];

const ITEMS_LUCES = [
  "Luces Altas", "Luces Bajas", "Luces Retroceso", "Intermitentes",
  "Luces Patente", "Luces Freno", "Luces Emergencia", "Faenero", "Neblineros"
];
const ITEMS_MOTOR = [
  "Sonido Normal", "Correas", "Nivel Refrigerante",
  "Mangueras", "Nivel Aceite", "Nivel Líquido Dirección"
];
const ITEMS_ACCESORIOS = [
  "Baliza", "Camilla", "Cinturones", "Oxígeno", "Bocina",
  "Parabrisas", "Espejos", "Extintor", "Cuñas", "Sirena",
  "Radio Comunicación", "Kit Primeros Auxilios"
];
const ITEMS_DOCUMENTOS = [
  "Permiso de Circulación", "Revisión Técnica", "Seguro Obligatorio"
];

const DAMAGE_ZONES = [
  { id: "frontal", label: "Frontal" },
  { id: "trasera", label: "Trasera" },
  { id: "lateral_izq", label: "Lateral Izq." },
  { id: "lateral_der", label: "Lateral Der." },
  { id: "techo", label: "Techo" },
  { id: "inferior", label: "Inferior" },
];

function initChecklist(items) {
  return items.reduce((acc, item) => {
    acc[item] = { estado: "bueno", obs: "" };
    return acc;
  }, {});
}

function ChecklistSection({ title, icon: Icon, color, items, data, onChange, expanded, onToggle }) {
  const badCount = items.filter(i => data[i]?.estado === "malo").length;
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ borderBottom: expanded ? "1px solid #E2E8F0" : "none" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-800" style={{ fontFamily: "Manrope, sans-serif" }}>{title}</p>
            <p className="text-xs text-slate-400">{items.length} ítems{badCount > 0 ? ` · ${badCount} con falla` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badCount > 0 && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#FEF2F2", color: "#DC2626" }}>
              {badCount} malo{badCount > 1 ? "s" : ""}
            </span>
          )}
          {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-slate-50">
          {items.map(item => (
            <div key={item} className="px-5 py-3.5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-semibold text-slate-700" style={{ fontFamily: "Manrope, sans-serif" }}>{item}</span>
                <div className="flex gap-2 flex-shrink-0">
                  {["bueno", "malo"].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onChange(item, "estado", val)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={data[item]?.estado === val
                        ? val === "bueno"
                          ? { background: "#10B981", color: "white" }
                          : { background: "#EF4444", color: "white" }
                        : { background: "#F1F5F9", color: "#64748B" }
                      }>
                      {val === "bueno" ? "Bueno" : "Malo"}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                placeholder="Observaciones..."
                value={data[item]?.obs || ""}
                onChange={e => onChange(item, "obs", e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all"
                style={{ fontFamily: "Manrope, sans-serif" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PautaInspeccionSemanal({ equipos, onSuccess }) {
  const [step, setStep] = useState(1); // 1: datos básicos, 2: daños, 3: checklists, 4: resumen

  const [form, setForm] = useState({
    equipo_id: "",
    conductor: "",
    fecha: new Date().toISOString().split("T")[0],
    km_inicial: "",
    km_final: "",
    combustible: "1/2",
  });

  const [danos, setDanos] = useState({});
  const [luces, setLuces] = useState(initChecklist(ITEMS_LUCES));
  const [motor, setMotor] = useState(initChecklist(ITEMS_MOTOR));
  const [accesorios, setAccesorios] = useState(initChecklist(ITEMS_ACCESORIOS));
  const [documentos, setDocumentos] = useState(initChecklist(ITEMS_DOCUMENTOS));
  const [expanded, setExpanded] = useState({ luces: true, motor: false, accesorios: false, documentos: false });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalItems = ITEMS_LUCES.length + ITEMS_MOTOR.length + ITEMS_ACCESORIOS.length + ITEMS_DOCUMENTOS.length;
  const doneItems = [luces, motor, accesorios, documentos].reduce((acc, cat) =>
    acc + Object.values(cat).filter(v => v.estado).length, 0);
  const progress = Math.round((step - 1) * 33);

  const equipo = equipos.find(e => e.id === form.equipo_id);

  const updateChecklist = (setter) => (item, field, value) => {
    setter(prev => ({ ...prev, [item]: { ...prev[item], [field]: value } }));
  };

  const buildObservaciones = () => {
    const lines = [];
    const cats = [
      { name: "LUCES", data: luces, items: ITEMS_LUCES },
      { name: "MOTOR", data: motor, items: ITEMS_MOTOR },
      { name: "ACCESORIOS", data: accesorios, items: ITEMS_ACCESORIOS },
      { name: "DOCUMENTOS", data: documentos, items: ITEMS_DOCUMENTOS },
    ];
    cats.forEach(({ name, data, items }) => {
      const malos = items.filter(i => data[i]?.estado === "malo");
      if (malos.length > 0) {
        lines.push(`[${name}] Fallas: ${malos.map(i => {
          const obs = data[i]?.obs;
          return obs ? `${i} (${obs})` : i;
        }).join(", ")}`);
      }
    });
    const danosList = Object.entries(danos).filter(([, v]) => v).map(([k]) => k);
    if (danosList.length > 0) lines.push(`Daños reportados: ${danosList.join(", ")}`);
    if (form.km_inicial) lines.push(`KM Inicial: ${form.km_inicial}`);
    if (form.km_final) lines.push(`KM Final: ${form.km_final}`);
    lines.push(`Combustible: ${form.combustible}`);
    return lines.join(" | ");
  };

  const handleSubmit = async () => {
    if (!form.equipo_id || !form.conductor || !form.km_inicial) {
      setError("Completa los campos obligatorios.");
      return;
    }
    setError("");
    setSaving(true);

    const observaciones = buildObservaciones();
    const allItems = { ...luces, ...motor, ...accesorios, ...documentos };
    const hasFallas = Object.values(allItems).some(v => v.estado === "malo");

    await base44.entities.Actividad.create({
      equipo_id: form.equipo_id,
      tipo: "inspeccion_semanal",
      fecha: form.fecha,
      usuario_nombre: form.conductor,
      observaciones,
    });

    // También guardar el kilometraje
    const kmInicial = Number(form.km_inicial);
    const activos = await base44.entities.Kilometraje.filter({ equipo_id: form.equipo_id });
    const activo = activos.find(r => !r.km_final);
    if (activo) {
      await base44.entities.Kilometraje.update(activo.id, { km_final: kmInicial });
    }
    await base44.entities.Kilometraje.create({
      equipo_id: form.equipo_id,
      fecha: form.fecha,
      conductor: form.conductor,
      valor_km: kmInicial,
      km_inicial: kmInicial,
      ...(form.km_final ? { km_final: Number(form.km_final) } : {}),
      observaciones,
    });

    setSaving(false);
    onSuccess && onSuccess({ hasFallas, conductor: form.conductor });
  };

  return (
    <div className="space-y-4" style={{ fontFamily: "Manrope, sans-serif" }}>
      {/* Header con progreso */}
      <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0", background: "linear-gradient(135deg, #1A365D 0%, #2563EB 100%)" }}>
        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Pauta Semanal · Ambulancia</p>
        <h2 className="text-xl font-bold text-white mb-3">Inspección de Vehículo</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-white/20">
            <div className="h-2 rounded-full bg-white transition-all duration-500" style={{ width: `${progress + (step === 4 ? 100 : 0)}%` }} />
          </div>
          <span className="text-xs font-bold text-white/80">{step}/3</span>
        </div>
        <div className="flex gap-2 mt-3">
          {[
            { n: 1, label: "Datos" },
            { n: 2, label: "Daños" },
            { n: 3, label: "Revisión" }
          ].map(s => (
            <button key={s.n} type="button" onClick={() => s.n < step && setStep(s.n)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={step === s.n
                ? { background: "white", color: "#1D4ED8" }
                : step > s.n
                ? { background: "rgba(255,255,255,0.3)", color: "white" }
                : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
              }>
              {s.n}. {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* PASO 1: Datos básicos */}
      {step === 1 && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-5 space-y-4" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos del Conductor</p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ambulancia *</label>
              <select
                required
                value={form.equipo_id}
                onChange={e => setForm(f => ({ ...f, equipo_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Selecciona una ambulancia...</option>
                {equipos.map(eq => (
                  <option key={eq.id} value={eq.id}>
                    {eq.marca} {eq.modelo}{eq.patente ? ` — ${eq.patente}` : ""} ({eq.centro_principal})
                  </option>
                ))}
              </select>
              {equipo && (
                <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  {equipo.centro_principal}{equipo.subsede ? ` · ${equipo.subsede}` : ""}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nombre del Chofer *</label>
              <input
                required type="text" placeholder="Ej: Juan Pérez"
                value={form.conductor}
                onChange={e => setForm(f => ({ ...f, conductor: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Fecha *</label>
              <input
                type="date" value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">KM Inicial *</label>
                <input
                  type="number" min="0" placeholder="45230"
                  value={form.km_inicial}
                  onChange={e => setForm(f => ({ ...f, km_inicial: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">KM Final</label>
                <input
                  type="number" min="0" placeholder="45500"
                  value={form.km_final}
                  onChange={e => setForm(f => ({ ...f, km_final: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>
          </div>

          {/* Nivel combustible */}
          <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-500" /> Nivel de Combustible
            </p>
            <div className="flex gap-2">
              {NIVEL_COMBUSTIBLE.map(n => (
                <button key={n} type="button"
                  onClick={() => setForm(f => ({ ...f, combustible: n }))}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={form.combustible === n
                    ? { background: "#F59E0B", color: "white", boxShadow: "0 2px 8px rgba(245,158,11,0.35)" }
                    : { background: "#F8FAFC", color: "#94A3B8", border: "1px solid #E2E8F0" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (!form.equipo_id || !form.conductor || !form.km_inicial) {
                setError("Completa los campos obligatorios.");
                return;
              }
              setError("");
              setStep(2);
            }}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #1A365D, #2563EB)" }}>
            Continuar →
          </button>
        </div>
      )}

      {/* PASO 2: Registro de daños */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E2E8F0" }}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-500" /> Registro de Daños Visuales
            </p>
            <p className="text-xs text-slate-400 mb-4">Selecciona las zonas donde se detectaron daños</p>

            {/* Diagrama ambulancia simplificado */}
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#F0F4FF", border: "2px dashed #C7D2FE" }}>
              <div className="p-4 text-center">
                <Car className="w-16 h-16 text-blue-300 mx-auto mb-2" />
                <p className="text-xs text-blue-400 font-medium">Toca las zonas para marcar daños</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DAMAGE_ZONES.map(z => (
                <button key={z.id} type="button"
                  onClick={() => setDanos(prev => ({ ...prev, [z.id]: !prev[z.id] }))}
                  className="py-3 rounded-xl text-xs font-bold transition-all"
                  style={danos[z.id]
                    ? { background: "#FEF2F2", color: "#DC2626", border: "2px solid #FECACA" }
                    : { background: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}>
                  {danos[z.id] ? "⚠ " : ""}{z.label}
                </button>
              ))}
            </div>
            {Object.values(danos).some(v => v) && (
              <p className="text-xs text-red-500 mt-3 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Daños marcados: {Object.entries(danos).filter(([, v]) => v).map(([k]) => DAMAGE_ZONES.find(z => z.id === k)?.label).join(", ")}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)}
              className="px-5 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200">
              ← Atrás
            </button>
            <button type="button" onClick={() => setStep(3)}
              className="flex-1 py-4 rounded-2xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1A365D, #2563EB)" }}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Checklists */}
      {step === 3 && (
        <div className="space-y-3">
          <ChecklistSection
            title="Luces" icon={Zap} color="#F59E0B"
            items={ITEMS_LUCES} data={luces}
            onChange={updateChecklist(setLuces)}
            expanded={expanded.luces}
            onToggle={() => setExpanded(e => ({ ...e, luces: !e.luces }))}
          />
          <ChecklistSection
            title="Motor" icon={Wrench} color="#2563EB"
            items={ITEMS_MOTOR} data={motor}
            onChange={updateChecklist(setMotor)}
            expanded={expanded.motor}
            onToggle={() => setExpanded(e => ({ ...e, motor: !e.motor }))}
          />
          <ChecklistSection
            title="Accesorios" icon={Package} color="#7C3AED"
            items={ITEMS_ACCESORIOS} data={accesorios}
            onChange={updateChecklist(setAccesorios)}
            expanded={expanded.accesorios}
            onToggle={() => setExpanded(e => ({ ...e, accesorios: !e.accesorios }))}
          />
          <ChecklistSection
            title="Documentos" icon={FileText} color="#059669"
            items={ITEMS_DOCUMENTOS} data={documentos}
            onChange={updateChecklist(setDocumentos)}
            expanded={expanded.documentos}
            onToggle={() => setExpanded(e => ({ ...e, documentos: !e.documentos }))}
          />

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)}
              className="px-5 py-4 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200">
              ← Atrás
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="flex-1 py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #065F46, #059669)" }}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Send className="w-4 h-4" /> Finalizar Inspección</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}