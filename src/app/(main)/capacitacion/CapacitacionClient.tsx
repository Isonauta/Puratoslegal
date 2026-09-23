"use client";

import { useState } from "react";

const PROGRAMAS = ["SST", "MA", "SGI", "General"];
const TIPOS = ["Inducción", "Entrenamiento", "Charla", "Curso", "Simulacro", "Otro"];
const MODALIDADES = ["Presencial", "Virtual", "E-learning"];
const ESTADOS = ["Planificada", "Realizada", "Cancelada", "Reprogramada"];

const ESTADO_COLOR: Record<string, string> = {
  Planificada: "bg-blue-50 text-blue-600",
  Realizada: "bg-green-50 text-green-700",
  Cancelada: "bg-red-50 text-red-600",
  Reprogramada: "bg-yellow-50 text-yellow-700",
};

const PROGRAMA_COLOR: Record<string, string> = {
  SST: "bg-orange-100 text-orange-700",
  MA: "bg-emerald-100 text-emerald-700",
  SGI: "bg-violet-100 text-violet-700",
  General: "bg-zinc-100 text-zinc-600",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

interface Cap {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  programa: string;
  area: string | null;
  relator: string | null;
  modalidad: string;
  fechaPlan: string;
  fechaReal: string | null;
  duracionHrs: number;
  estado: string;
  participantes: number;
  evaluacion: number | null;
  evidencia: string | null;
  comentario: string | null;
  createdAt: string;
}

// ── Modal Registro ──────────────────────────────────────────────────────────
function RegistroModal({ onClose, onSaved }: { onClose: () => void; onSaved: (item: Cap) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: "", descripcion: "", tipo: "Charla", programa: "SST",
    area: "", relator: "", modalidad: "Presencial",
    fechaPlan: "", duracionHrs: "1", participantes: "0", comentario: "",
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/capacitacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) onSaved(await res.json());
    setSaving(false);
  }

  const inp = "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none";
  const lbl = "block text-xs font-medium text-zinc-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">Planificar Capacitación</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Título *</label>
            <input className={inp} value={form.titulo} onChange={e => set("titulo", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tipo</label>
              <select className={inp} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Programa</label>
              <select className={inp} value={form.programa} onChange={e => set("programa", e.target.value)}>
                {PROGRAMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Modalidad</label>
              <select className={inp} value={form.modalidad} onChange={e => set("modalidad", e.target.value)}>
                {MODALIDADES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Área</label>
              <input className={inp} placeholder="ej. Producción" value={form.area} onChange={e => set("area", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Fecha planificada *</label>
              <input className={inp} type="date" value={form.fechaPlan} onChange={e => set("fechaPlan", e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>Duración (hrs)</label>
              <input className={inp} type="number" step="0.5" min="0.5" value={form.duracionHrs} onChange={e => set("duracionHrs", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>N° participantes</label>
              <input className={inp} type="number" min="0" value={form.participantes} onChange={e => set("participantes", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl}>Relator / Instructor</label>
            <input className={inp} value={form.relator} onChange={e => set("relator", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Descripción</label>
            <textarea className={inp} rows={2} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Comentario</label>
            <textarea className={inp} rows={2} value={form.comentario} onChange={e => set("comentario", e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
              {saving ? "Guardando…" : "Planificar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Detalle ───────────────────────────────────────────────────────────
function DetalleModal({ item, isAdmin, onClose, onUpdated }: {
  item: Cap; isAdmin: boolean; onClose: () => void; onUpdated: (item: Cap) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [estado, setEstado] = useState(item.estado);
  const [fechaReal, setFechaReal] = useState(item.fechaReal ? item.fechaReal.slice(0, 10) : "");
  const [participantes, setParticipantes] = useState(String(item.participantes));
  const [evaluacion, setEvaluacion] = useState(item.evaluacion !== null ? String(item.evaluacion) : "");
  const [evidencia, setEvidencia] = useState(item.evidencia ?? "");
  const [comentario, setComentario] = useState(item.comentario ?? "");

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/capacitacion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, estado, fechaReal: fechaReal || null, participantes, evaluacion, evidencia, comentario }),
    });
    if (res.ok) onUpdated(await res.json());
    setSaving(false);
  }

  const inp = "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none";
  const lbl = "block text-xs font-medium text-zinc-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROGRAMA_COLOR[item.programa] ?? "bg-zinc-100 text-zinc-600"}`}>{item.programa}</span>
            <span className="text-xs text-zinc-400">CAP-{String(item.numero).padStart(3, "0")}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[item.estado] ?? "bg-zinc-100 text-zinc-500"}`}>{item.estado}</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-base font-semibold text-zinc-900">{item.titulo}</p>
            {item.descripcion && <p className="text-sm text-zinc-500 mt-0.5">{item.descripcion}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-zinc-400">Tipo: </span><span className="text-zinc-700">{item.tipo}</span></div>
            <div><span className="text-zinc-400">Modalidad: </span><span className="text-zinc-700">{item.modalidad}</span></div>
            {item.relator && <div><span className="text-zinc-400">Relator: </span><span className="text-zinc-700">{item.relator}</span></div>}
            {item.area && <div><span className="text-zinc-400">Área: </span><span className="text-zinc-700">{item.area}</span></div>}
            <div><span className="text-zinc-400">Fecha plan: </span><span className="text-zinc-700">{fmt(item.fechaPlan)}</span></div>
            <div><span className="text-zinc-400">Duración: </span><span className="text-zinc-700">{item.duracionHrs} hrs</span></div>
          </div>

          {isAdmin && (
            <>
              <hr className="border-zinc-100" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Estado</label>
                  <select className={inp} value={estado} onChange={e => setEstado(e.target.value)}>
                    {ESTADOS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Fecha realización</label>
                  <input className={inp} type="date" value={fechaReal} onChange={e => setFechaReal(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>N° participantes</label>
                  <input className={inp} type="number" min="0" value={participantes} onChange={e => setParticipantes(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Evaluación (nota/% aprobación)</label>
                  <input className={inp} type="number" step="0.1" min="0" max="100" placeholder="ej. 5.8 o 87" value={evaluacion} onChange={e => setEvaluacion(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={lbl}>Evidencia (link o descripción)</label>
                <input className={inp} placeholder="URL o descripción del registro" value={evidencia} onChange={e => setEvidencia(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Comentario</label>
                <textarea className={inp} rows={2} value={comentario} onChange={e => setComentario(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Cerrar</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
                  {saving ? "Guardando…" : "Actualizar"}
                </button>
              </div>
            </>
          )}
          {!isAdmin && (
            <div className="flex justify-end"><button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Cerrar</button></div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function CapacitacionClient({ items: initial, isAdmin }: { items: Cap[]; isAdmin: boolean }) {
  const [items, setItems] = useState<Cap[]>(initial);
  const [showRegistro, setShowRegistro] = useState(false);
  const [selected, setSelected] = useState<Cap | null>(null);
  const [filEstado, setFilEstado] = useState("Todos");
  const [filPrograma, setFilPrograma] = useState("Todos");

  const filtered = items.filter(i => {
    if (filEstado !== "Todos" && i.estado !== filEstado) return false;
    if (filPrograma !== "Todos" && i.programa !== filPrograma) return false;
    return true;
  });

  // KPIs
  const planificadas = items.filter(i => i.estado === "Planificada").length;
  const realizadas = items.filter(i => i.estado === "Realizada").length;
  const totalParticipantes = items.filter(i => i.estado === "Realizada").reduce((s, i) => s + i.participantes, 0);
  const totalHrs = items.filter(i => i.estado === "Realizada").reduce((s, i) => s + i.duracionHrs, 0);

  // Cumplimiento: realizadas / (realizadas + planificadas vencidas)
  const hoy = new Date();
  const vencidas = items.filter(i => i.estado === "Planificada" && new Date(i.fechaPlan) < hoy).length;
  const pctCumplimiento = (realizadas + vencidas) > 0 ? Math.round((realizadas / (realizadas + vencidas)) * 100) : 100;

  function handleSaved(item: Cap) {
    setItems(prev => [item, ...prev]);
    setShowRegistro(false);
  }

  function handleUpdated(updated: Cap) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    setSelected(updated);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Competencias y Capacitación</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Plan anual de capacitación y seguimiento</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowRegistro(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26]">
            <span className="text-base leading-none">+</span> Planificar
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Planificadas", value: planificadas, color: "text-blue-600" },
          { label: "Realizadas", value: realizadas, color: "text-green-600" },
          { label: "Participantes", value: totalParticipantes, color: "text-zinc-800" },
          { label: "Horas formación", value: `${totalHrs}h`, color: "text-zinc-800" },
        ].map(k => (
          <div key={k.label} className="bg-white border border-zinc-100 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-400 uppercase tracking-wide">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de cumplimiento */}
      <div className="bg-white border border-zinc-100 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700">Cumplimiento del plan</span>
          <span className="text-sm font-bold text-zinc-800">{pctCumplimiento}%</span>
        </div>
        <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all ${pctCumplimiento >= 80 ? "bg-green-500" : pctCumplimiento >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
            style={{ width: `${pctCumplimiento}%` }}
          />
        </div>
        {vencidas > 0 && <p className="text-xs text-red-500 mt-1">{vencidas} capacitación{vencidas > 1 ? "es" : ""} planificada{vencidas > 1 ? "s" : ""} con fecha vencida sin realizar</p>}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        {["Todos", ...ESTADOS].map(s => (
          <button key={s} onClick={() => setFilEstado(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filEstado === s ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
            {s}
          </button>
        ))}
        <span className="text-zinc-200">|</span>
        {["Todos", ...PROGRAMAS].map(p => (
          <button key={p} onClick={() => setFilPrograma(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filPrograma === p ? "bg-zinc-700 text-white border-zinc-700" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">No hay capacitaciones para este filtro.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const vencida = item.estado === "Planificada" && new Date(item.fechaPlan) < hoy;
            return (
              <button key={item.id} onClick={() => setSelected(item)}
                className={`w-full text-left bg-white border rounded-xl px-5 py-4 hover:shadow-sm transition-all ${vencida ? "border-red-200 hover:border-red-300" : "border-zinc-100 hover:border-[#C41230]/40"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROGRAMA_COLOR[item.programa] ?? "bg-zinc-100 text-zinc-600"}`}>{item.programa}</span>
                      <span className="text-xs text-zinc-400">CAP-{String(item.numero).padStart(3, "0")} · {item.tipo}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[item.estado] ?? "bg-zinc-100 text-zinc-500"}`}>{item.estado}</span>
                      {vencida && <span className="text-xs font-semibold text-red-500">Vencida</span>}
                    </div>
                    <p className="text-sm font-medium text-zinc-800 truncate">{item.titulo}</p>
                    <div className="flex gap-3 mt-1 text-xs text-zinc-400 flex-wrap">
                      <span>{item.modalidad}</span>
                      {item.relator && <span>· {item.relator}</span>}
                      {item.area && <span>· {item.area}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-zinc-500">{fmt(item.fechaPlan)}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{item.duracionHrs}h · {item.participantes} pers.</p>
                    {item.evaluacion !== null && (
                      <p className="text-xs font-semibold text-green-600 mt-0.5">Eval: {item.evaluacion}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showRegistro && <RegistroModal onClose={() => setShowRegistro(false)} onSaved={handleSaved} />}
      {selected && <DetalleModal item={selected} isAdmin={isAdmin} onClose={() => setSelected(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
