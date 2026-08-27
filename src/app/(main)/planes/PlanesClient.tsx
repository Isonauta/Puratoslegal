"use client";
import { useState, useMemo } from "react";

type Actividad = {
  id: string;
  programa: string;
  area: string;
  asignadoA: string | null;
  codigoExterno: string | null;
  eje: string;
  clausula: string | null;
  actividad: string;
  descripcion: string | null;
  responsable: string | null;
  inicio: string | null;
  fin: string | null;
  frecuencia: string | null;
  evidencia: string | null;
  kpi: string | null;
  meta: string | null;
  prioridad: string;
  estado: string;
  avance: number;
  comentario: string | null;
};

const ESTADOS = ["No iniciado", "En curso", "Completado", "Atrasado"] as const;
const PROGRAMAS = [
  { key: "SST", label: "SST ISO 45001", color: "bg-red-600", light: "bg-red-50 text-red-700 border-red-200" },
  { key: "MA", label: "Medio Ambiente ISO 14001", color: "bg-green-600", light: "bg-green-50 text-green-700 border-green-200" },
] as const;

const AREAS = [
  { key: "General", label: "General", icon: "📋" },
  { key: "Bodega", label: "Bodega", icon: "📦" },
  { key: "Calidad", label: "Calidad", icon: "🔬" },
  { key: "Mantenimiento", label: "Mantenimiento", icon: "🔧" },
  { key: "Producción", label: "Producción", icon: "🏭" },
] as const;

function estadoColor(estado: string) {
  if (estado === "Completado") return "bg-emerald-100 text-emerald-700";
  if (estado === "En curso") return "bg-blue-100 text-blue-700";
  if (estado === "Atrasado") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-500";
}

function prioridadDot(p: string) {
  if (p === "Alta") return "bg-red-500";
  if (p === "Media") return "bg-amber-400";
  return "bg-gray-300";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

function DashboardPrograma({ actividades, programa }: { actividades: Actividad[]; programa: typeof PROGRAMAS[number] }) {
  const [expandido, setExpandido] = useState(false);

  const total = actividades.length;
  const completados = actividades.filter(a => a.estado === "Completado").length;
  const enCurso = actividades.filter(a => a.estado === "En curso").length;
  const atrasados = actividades.filter(a => a.estado === "Atrasado").length;
  const noIniciados = actividades.filter(a => a.estado === "No iniciado").length;
  const avanceGlobal = total > 0 ? actividades.reduce((s, a) => s + a.avance, 0) / total : 0;

  const ejes = [...new Set(actividades.map(a => a.eje))];
  const ejeSummary = ejes.map(eje => {
    const acts = actividades.filter(a => a.eje === eje);
    const pct = acts.reduce((s, a) => s + a.avance, 0) / acts.length;
    return { eje, pct, total: acts.length };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full ${programa.color}`} />
        <h2 className="font-semibold text-gray-900">{programa.label}</h2>
        <span className="text-xs text-gray-400 ml-auto">{total} actividades</span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Avance global</span>
          <span className="font-semibold text-gray-800">{Math.round(avanceGlobal * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${programa.color}`} style={{ width: `${avanceGlobal * 100}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Completados", value: completados, cls: "text-emerald-600" },
          { label: "En curso", value: enCurso, cls: "text-blue-600" },
          { label: "Atrasados", value: atrasados, cls: "text-red-600" },
          { label: "Pendientes", value: noIniciados, cls: "text-gray-400" },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setExpandido(v => !v)}
        className="mt-4 w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100 pt-3 transition-colors"
      >
        <span>Detalle por eje</span>
        <span>{expandido ? "▲" : "▼"}</span>
      </button>

      {expandido && (
        <div className="mt-3 space-y-2">
          {ejeSummary.map(({ eje, pct, total: t }) => (
            <div key={eje}>
              <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                <span className="truncate">{eje}</span>
                <span className="shrink-0 ml-2 text-gray-400">{t} act. · {Math.round(pct * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${programa.color} opacity-70`} style={{ width: `${pct * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditModal({ actividad, onClose, onSaved }: { actividad: Actividad; onClose: () => void; onSaved: (updated: Actividad) => void }) {
  const [estado, setEstado] = useState(actividad.estado);
  const [avance, setAvance] = useState(Math.round(actividad.avance * 100));
  const [comentario, setComentario] = useState(actividad.comentario ?? "");
  const [inicio, setInicio] = useState(actividad.inicio ? actividad.inicio.slice(0, 10) : "");
  const [fin, setFin] = useState(actividad.fin ? actividad.fin.slice(0, 10) : "");
  const [prioridad, setPrioridad] = useState(actividad.prioridad ?? "Media");
  const [saving, setSaving] = useState(false);

  // Split stored "Cargo — Nombre" into two fields
  const stored = actividad.asignadoA ?? "";
  const sepIdx = stored.indexOf(" — ");
  const [cargo, setCargo] = useState(sepIdx >= 0 ? stored.slice(0, sepIdx) : "");
  const [nombre, setNombre] = useState(sepIdx >= 0 ? stored.slice(sepIdx + 3) : stored);

  async function handleSave() {
    setSaving(true);
    const asignadoA = nombre.trim() ? `${cargo.trim()}${cargo.trim() ? " — " : ""}${nombre.trim()}` : null;
    const res = await fetch("/api/planes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: actividad.id, estado, avance: avance / 100,
        comentario: comentario || null, asignadoA,
        inicio: inicio || null, fin: fin || null, prioridad,
      }),
    });
    setSaving(false);
    if (res.ok) { onSaved(await res.json()); onClose(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900 leading-snug pr-4">{actividad.actividad}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl shrink-0">×</button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
              <input
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Ej: Jefe de Bodega"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nombre completo"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha término</label>
              <input type="date" value={fin} onChange={e => setFin(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                {ESTADOS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                {["Alta","Media","Baja"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">% Avance: <span className="font-bold">{avance}%</span></label>
            <input type="range" min={0} max={100} step={5} value={avance} onChange={e => setAvance(Number(e.target.value))} className="w-full accent-red-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentario / Riesgo</label>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Observaciones, riesgos o bloqueos…" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActividadRow({ a, isAdmin, onEdit }: { a: Actividad; isAdmin: boolean; onEdit: () => void }) {
  const vencida = a.fin && new Date(a.fin) < new Date() && a.estado !== "Completado";
  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${vencida ? "bg-red-50/30" : ""}`}>
      <td className="py-3 px-3 text-xs text-gray-400 whitespace-nowrap">{a.codigoExterno}</td>
      <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">{a.eje}</td>
      <td className="py-3 px-3">
        <div className="text-sm text-gray-900 font-medium leading-snug">{a.actividad}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {a.asignadoA ? (
            <span className="font-medium text-indigo-600">{a.asignadoA}</span>
          ) : a.responsable ? (
            <span>{a.responsable}</span>
          ) : null}
        </div>
      </td>
      <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap hidden lg:table-cell">
        <div>{formatDate(a.inicio)}</div>
        <div className="text-gray-400">→ {formatDate(a.fin)}</div>
      </td>
      <td className="py-3 px-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor(a.estado)}`}>
          {a.estado}
        </span>
      </td>
      <td className="py-3 px-3 hidden md:table-cell">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
            <div className="h-full bg-red-500 rounded-full" style={{ width: `${a.avance * 100}%` }} />
          </div>
          <span className="text-xs text-gray-500 w-8 text-right">{Math.round(a.avance * 100)}%</span>
        </div>
      </td>
      <td className="py-3 px-3 hidden xl:table-cell">
        <div className={`w-2 h-2 rounded-full mx-auto ${prioridadDot(a.prioridad)}`} title={a.prioridad} />
      </td>
      {isAdmin && (
        <td className="py-3 px-3">
          <button onClick={onEdit} className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded-lg">
            Editar
          </button>
        </td>
      )}
    </tr>
  );
}

export default function PlanesClient({ actividades: initial, isAdmin }: { actividades: Actividad[]; isAdmin: boolean }) {
  const [actividades, setActividades] = useState(initial);
  const [areaActiva, setAreaActiva] = useState<string>("General");
  const [programa, setPrograma] = useState<"SST" | "MA">("SST");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [editando, setEditando] = useState<Actividad | null>(null);

  const actsByArea = useMemo(() => actividades.filter(a => a.area === areaActiva), [actividades, areaActiva]);
  const sstActs = useMemo(() => actsByArea.filter(a => a.programa === "SST"), [actsByArea]);
  const maActs = useMemo(() => actsByArea.filter(a => a.programa === "MA"), [actsByArea]);

  const filtradas = useMemo(() => {
    return actsByArea
      .filter(a => a.programa === programa)
      .filter(a => filtroEstado === "Todos" || a.estado === filtroEstado);
  }, [actsByArea, programa, filtroEstado]);

  function handleSaved(updated: Actividad) {
    setActividades(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a));
  }

  const areasConDatos = useMemo(() => {
    const keys = new Set(actividades.map(a => a.area));
    return AREAS.filter(a => keys.has(a.key));
  }, [actividades]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planes de trabajo</h1>
        <p className="text-sm text-gray-500 mt-1">SST ISO 45001 · Medio Ambiente ISO 14001 · 2026–2027</p>
      </div>

      {/* Tabs de área */}
      <div className="flex flex-wrap gap-2">
        {areasConDatos.map(a => (
          <button
            key={a.key}
            onClick={() => { setAreaActiva(a.key); setFiltroEstado("Todos"); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              areaActiva === a.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            <span>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PROGRAMAS.map(p => (
          <DashboardPrograma key={p.key} actividades={p.key === "SST" ? sstActs : maActs} programa={p} />
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {PROGRAMAS.map(p => (
              <button key={p.key} onClick={() => setPrograma(p.key as "SST" | "MA")} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${programa === p.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                {p.key}
              </button>
            ))}
          </div>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-400">
            <option>Todos</option>
            {ESTADOS.map(e => <option key={e}>{e}</option>)}
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtradas.length} actividades</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="py-2 px-3">ID</th>
                <th className="py-2 px-3">Eje</th>
                <th className="py-2 px-3">Actividad / Asignado</th>
                <th className="py-2 px-3 hidden lg:table-cell">Fechas</th>
                <th className="py-2 px-3">Estado</th>
                <th className="py-2 px-3 hidden md:table-cell">Avance</th>
                <th className="py-2 px-3 hidden xl:table-cell">Prior.</th>
                {isAdmin && <th className="py-2 px-3" />}
              </tr>
            </thead>
            <tbody>
              {filtradas.map(a => (
                <ActividadRow key={a.id} a={a} isAdmin={isAdmin} onEdit={() => setEditando(a)} />
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-gray-400">No hay actividades para este filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editando && (
        <EditModal actividad={editando} onClose={() => setEditando(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
