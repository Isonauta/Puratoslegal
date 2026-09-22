"use client";

import { useState } from "react";

const PROGRAMAS = ["SST", "MA", "SGI"];
const FRECUENCIAS = ["Mensual", "Trimestral", "Semestral", "Anual"];
const ESTADOS = ["En curso", "Logrado", "No logrado", "Suspendido"];
const AREAS = ["Producción", "Calidad", "Logística", "Mantenimiento", "RRHH", "SST", "Administración", "Gerencia"];
const ANIO_ACTUAL = new Date().getFullYear();

const ESTADO_COLOR: Record<string, string> = {
  "En curso": "bg-blue-100 text-blue-700",
  "Logrado": "bg-green-100 text-green-700",
  "No logrado": "bg-red-100 text-red-700",
  "Suspendido": "bg-zinc-100 text-zinc-500",
};

const PROGRAMA_COLOR: Record<string, string> = {
  SST: "bg-orange-100 text-orange-700",
  MA: "bg-emerald-100 text-emerald-700",
  SGI: "bg-violet-100 text-violet-700",
};

interface OI {
  id: string;
  numero: number;
  programa: string;
  clausula: string | null;
  objetivo: string;
  indicador: string;
  unidad: string;
  meta: number;
  valorActual: number;
  frecuencia: string;
  responsable: string | null;
  area: string | null;
  anio: number;
  estado: string;
  comentario: string | null;
  createdAt: string;
  updatedAt: string;
}

function avancePct(valorActual: number, meta: number): number {
  if (meta === 0) return 0;
  return Math.min(100, Math.round((valorActual / meta) * 100));
}

function semaforoColor(pct: number, estado: string): string {
  if (estado === "Logrado") return "bg-green-500";
  if (estado === "No logrado" || estado === "Suspendido") return "bg-red-400";
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-400";
  return "bg-red-400";
}

// ── Modal Registro ──────────────────────────────────────────────────────────
function RegistroModal({ onClose, onSaved }: { onClose: () => void; onSaved: (item: OI) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    programa: "SST", clausula: "", objetivo: "", indicador: "",
    unidad: "%", meta: "", frecuencia: "Mensual",
    responsable: "", area: "", anio: String(ANIO_ACTUAL), comentario: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/objetivos-indicadores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, meta: parseFloat(form.meta), anio: parseInt(form.anio) }),
    });
    if (res.ok) {
      const data = await res.json();
      onSaved(data);
    }
    setSaving(false);
  }

  const inp = "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none";
  const lbl = "block text-xs font-medium text-zinc-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">Nuevo Objetivo / Indicador</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Programa *</label>
              <select className={inp} value={form.programa} onChange={e => set("programa", e.target.value)}>
                {PROGRAMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Año *</label>
              <input className={inp} type="number" min="2020" max="2040" value={form.anio} onChange={e => set("anio", e.target.value)} required />
            </div>
          </div>
          <div>
            <label className={lbl}>Objetivo *</label>
            <input className={inp} placeholder="ej. Reducir la tasa de accidentabilidad" value={form.objetivo} onChange={e => set("objetivo", e.target.value)} required />
          </div>
          <div>
            <label className={lbl}>Indicador *</label>
            <input className={inp} placeholder="ej. Tasa de accidentabilidad mensual" value={form.indicador} onChange={e => set("indicador", e.target.value)} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Meta *</label>
              <input className={inp} type="number" step="any" placeholder="ej. 0" value={form.meta} onChange={e => set("meta", e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>Unidad</label>
              <input className={inp} placeholder="%, días, N°…" value={form.unidad} onChange={e => set("unidad", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Frecuencia</label>
              <select className={inp} value={form.frecuencia} onChange={e => set("frecuencia", e.target.value)}>
                {FRECUENCIAS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Responsable</label>
              <input className={inp} placeholder="Nombre" value={form.responsable} onChange={e => set("responsable", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Área</label>
              <select className={inp} value={form.area} onChange={e => set("area", e.target.value)}>
                <option value="">— Todas —</option>
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Cláusula (opcional)</label>
            <input className={inp} placeholder="ej. 6.2.1" value={form.clausula} onChange={e => set("clausula", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Comentario</label>
            <textarea className={inp} rows={2} value={form.comentario} onChange={e => set("comentario", e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal Detalle ───────────────────────────────────────────────────────────
function DetalleModal({ item, isAdmin, onClose, onUpdated }: {
  item: OI; isAdmin: boolean; onClose: () => void; onUpdated: (item: OI) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [valorActual, setValorActual] = useState(String(item.valorActual));
  const [estado, setEstado] = useState(item.estado);
  const [comentario, setComentario] = useState(item.comentario ?? "");

  const pct = avancePct(parseFloat(valorActual) || 0, item.meta);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/objetivos-indicadores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, valorActual, estado, comentario }),
    });
    if (res.ok) {
      const data = await res.json();
      onUpdated(data);
    }
    setSaving(false);
  }

  const inp = "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none";
  const lbl = "block text-xs font-medium text-zinc-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mr-2 ${PROGRAMA_COLOR[item.programa] ?? "bg-zinc-100 text-zinc-600"}`}>{item.programa}</span>
            <span className="text-sm font-semibold text-zinc-900">OI-{String(item.numero).padStart(3, "0")}</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide">Objetivo</p>
            <p className="text-sm font-medium text-zinc-800 mt-0.5">{item.objetivo}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide">Indicador</p>
            <p className="text-sm text-zinc-700 mt-0.5">{item.indicador}</p>
          </div>

          {/* Barra de avance */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-500">Avance</span>
              <span className="text-xs font-semibold text-zinc-700">{pct}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
              <div className={`h-2.5 rounded-full transition-all ${semaforoColor(pct, estado)}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-zinc-400 mt-0.5">
              <span>Actual: {valorActual} {item.unidad}</span>
              <span>Meta: {item.meta} {item.unidad}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {item.responsable && <div><span className="text-zinc-400">Responsable: </span><span className="text-zinc-700">{item.responsable}</span></div>}
            {item.area && <div><span className="text-zinc-400">Área: </span><span className="text-zinc-700">{item.area}</span></div>}
            <div><span className="text-zinc-400">Frecuencia: </span><span className="text-zinc-700">{item.frecuencia}</span></div>
            {item.clausula && <div><span className="text-zinc-400">Cláusula: </span><span className="text-zinc-700">{item.clausula}</span></div>}
          </div>

          {isAdmin && (
            <>
              <hr className="border-zinc-100" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Valor actual</label>
                  <input className={inp} type="number" step="any" value={valorActual} onChange={e => setValorActual(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Estado</label>
                  <select className={inp} value={estado} onChange={e => setEstado(e.target.value)}>
                    {ESTADOS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
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
            <div className="flex justify-end pt-1">
              <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Cerrar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function ObjetivosIndicadoresClient({ items: initial, isAdmin }: { items: OI[]; isAdmin: boolean }) {
  const [items, setItems] = useState<OI[]>(initial);
  const [showRegistro, setShowRegistro] = useState(false);
  const [selected, setSelected] = useState<OI | null>(null);
  const [filPrograma, setFilPrograma] = useState("Todos");
  const [filAnio, setFilAnio] = useState(String(ANIO_ACTUAL));

  const anios = Array.from(new Set(items.map(i => i.anio))).sort((a, b) => b - a);
  if (!anios.includes(ANIO_ACTUAL)) anios.unshift(ANIO_ACTUAL);

  const filtered = items.filter(i => {
    if (filPrograma !== "Todos" && i.programa !== filPrograma) return false;
    if (filAnio !== "Todos" && i.anio !== parseInt(filAnio)) return false;
    return true;
  });

  // KPIs
  const total = filtered.length;
  const logrados = filtered.filter(i => i.estado === "Logrado").length;
  const enCurso = filtered.filter(i => i.estado === "En curso").length;
  const noLogrados = filtered.filter(i => i.estado === "No logrado").length;
  const pctCumplimiento = total > 0 ? Math.round((logrados / total) * 100) : 0;

  function handleSaved(item: OI) {
    setItems(prev => [item, ...prev]);
    setShowRegistro(false);
  }

  function handleUpdated(updated: OI) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    setSelected(updated);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Objetivos e Indicadores</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Seguimiento de metas SST, MA y SGI</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowRegistro(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26]">
            <span className="text-base leading-none">+</span> Nuevo objetivo
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, color: "text-zinc-800" },
          { label: "Logrados", value: logrados, color: "text-green-600" },
          { label: "En curso", value: enCurso, color: "text-blue-600" },
          { label: "No logrados", value: noLogrados, color: "text-red-600" },
        ].map(k => (
          <div key={k.label} className="bg-white border border-zinc-100 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-400 uppercase tracking-wide">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de cumplimiento global */}
      {total > 0 && (
        <div className="bg-white border border-zinc-100 rounded-xl px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-700">Cumplimiento general</span>
            <span className="text-sm font-bold text-zinc-800">{pctCumplimiento}%</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${pctCumplimiento >= 80 ? "bg-green-500" : pctCumplimiento >= 50 ? "bg-yellow-400" : "bg-red-400"}`}
              style={{ width: `${pctCumplimiento}%` }}
            />
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 flex-wrap">
          {["Todos", ...PROGRAMAS].map(p => (
            <button
              key={p}
              onClick={() => setFilPrograma(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filPrograma === p ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}
            >{p}</button>
          ))}
        </div>
        <select
          className="ml-auto text-sm border border-zinc-200 rounded-lg px-3 py-1.5 focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none"
          value={filAnio}
          onChange={e => setFilAnio(e.target.value)}
        >
          <option value="Todos">Todos los años</option>
          {anios.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">No hay objetivos registrados para este filtro.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const pct = avancePct(item.valorActual, item.meta);
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="w-full text-left bg-white border border-zinc-100 rounded-xl px-5 py-4 hover:border-[#C41230]/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROGRAMA_COLOR[item.programa] ?? "bg-zinc-100 text-zinc-600"}`}>{item.programa}</span>
                      <span className="text-xs text-zinc-400">OI-{String(item.numero).padStart(3, "0")}</span>
                      {item.clausula && <span className="text-xs text-zinc-400">· {item.clausula}</span>}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[item.estado] ?? "bg-zinc-100 text-zinc-500"}`}>{item.estado}</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-800 truncate">{item.objetivo}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{item.indicador}</p>
                  </div>
                  {/* Mini semáforo */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className={`w-3 h-3 rounded-full ${semaforoColor(pct, item.estado)}`} />
                    <span className="text-xs font-semibold text-zinc-700">{pct}%</span>
                  </div>
                </div>
                {/* Barra */}
                <div className="mt-3 w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${semaforoColor(pct, item.estado)}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>Actual: {item.valorActual} {item.unidad}</span>
                  <span>Meta: {item.meta} {item.unidad} · {item.frecuencia}</span>
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
