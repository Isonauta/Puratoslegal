"use client";

import { useState } from "react";

const PROGRAMAS = ["SST", "MA", "SGI"];
const TIPOS = ["Riesgo", "Oportunidad"];
const TRATAMIENTOS_RIESGO = ["Mitigar", "Aceptar", "Transferir", "Eliminar"];
const TRATAMIENTOS_OPP = ["Aprovechar", "Aceptar", "Mitigar"];
const ESTADOS = ["Abierto", "En tratamiento", "Controlado", "Cerrado"];
const SCALE = [1, 2, 3, 4, 5];

const CLASIF_COLOR: Record<string, string> = {
  Crítico: "bg-red-100 text-red-700 border-red-200",
  Alto: "bg-orange-100 text-orange-700 border-orange-200",
  Medio: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Bajo: "bg-green-100 text-green-700 border-green-200",
};

const CLASIF_DOT: Record<string, string> = {
  Crítico: "bg-red-500",
  Alto: "bg-orange-400",
  Medio: "bg-yellow-400",
  Bajo: "bg-green-500",
};

const ESTADO_COLOR: Record<string, string> = {
  Abierto: "bg-red-50 text-red-600",
  "En tratamiento": "bg-blue-50 text-blue-600",
  Controlado: "bg-emerald-50 text-emerald-600",
  Cerrado: "bg-zinc-100 text-zinc-500",
};

const PROGRAMA_COLOR: Record<string, string> = {
  SST: "bg-orange-100 text-orange-700",
  MA: "bg-emerald-100 text-emerald-700",
  SGI: "bg-violet-100 text-violet-700",
};

function clasificar(p: number, i: number): string {
  const n = p * i;
  if (n >= 20) return "Crítico";
  if (n >= 12) return "Alto";
  if (n >= 6) return "Medio";
  return "Bajo";
}

interface RO {
  id: string;
  numero: number;
  tipo: string;
  programa: string;
  proceso: string;
  descripcion: string;
  causas: string | null;
  consecuencias: string | null;
  probabilidad: number;
  impacto: number;
  nivelRiesgo: number;
  clasificacion: string;
  tratamiento: string;
  accionControl: string | null;
  responsable: string | null;
  fechaRevision: string | null;
  estado: string;
  probabilidadR: number | null;
  impactoR: number | null;
  createdAt: string;
}

// ── Matriz 5x5 visual ───────────────────────────────────────────────────────
function MatrizRiesgo({ items }: { items: RO[] }) {
  function cellColor(p: number, i: number) {
    const n = p * i;
    if (n >= 20) return "bg-red-500/80";
    if (n >= 12) return "bg-orange-400/70";
    if (n >= 6) return "bg-yellow-300/80";
    return "bg-green-400/60";
  }

  function countAt(p: number, i: number) {
    return items.filter(r => r.tipo === "Riesgo" && r.probabilidad === p && r.impacto === i && r.estado !== "Cerrado").length;
  }

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-4 overflow-x-auto">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Matriz de Riesgos (Probabilidad × Impacto)</p>
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: "auto repeat(5, 40px)" }}>
        {/* Header row */}
        <div />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-8 flex items-center justify-center text-xs font-semibold text-zinc-500">{i}</div>
        ))}
        {/* Rows p=5..1 */}
        {[5, 4, 3, 2, 1].map(p => (
          <>
            <div key={`lbl-${p}`} className="w-8 flex items-center justify-center text-xs font-semibold text-zinc-500">{p}</div>
            {[1, 2, 3, 4, 5].map(i => {
              const count = countAt(p, i);
              return (
                <div key={`${p}-${i}`} className={`h-10 w-10 rounded flex items-center justify-center text-xs font-bold text-white ${cellColor(p, i)}`}>
                  {count > 0 ? count : ""}
                </div>
              );
            })}
          </>
        ))}
      </div>
      <div className="flex gap-4 mt-3 flex-wrap">
        {[["Crítico", "bg-red-500/80"], ["Alto", "bg-orange-400/70"], ["Medio", "bg-yellow-300/80"], ["Bajo", "bg-green-400/60"]].map(([l, c]) => (
          <span key={l} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span className={`w-3 h-3 rounded ${c}`} />{l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Modal Registro ──────────────────────────────────────────────────────────
function RegistroModal({ onClose, onSaved }: { onClose: () => void; onSaved: (item: RO) => void }) {
  const [saving, setSaving] = useState(false);
  const [tipo, setTipo] = useState("Riesgo");
  const [form, setForm] = useState({
    programa: "SST", proceso: "", descripcion: "", causas: "", consecuencias: "",
    probabilidad: "3", impacto: "3", tratamiento: "Mitigar",
    accionControl: "", responsable: "", fechaRevision: "",
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const previewClasif = clasificar(parseInt(form.probabilidad), parseInt(form.impacto));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/estrategia-riesgos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tipo }),
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
          <h2 className="text-base font-semibold text-zinc-900">Nuevo Riesgo / Oportunidad</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Tipo selector */}
          <div className="flex gap-2">
            {TIPOS.map(t => (
              <button key={t} type="button" onClick={() => { setTipo(t); set("tratamiento", t === "Riesgo" ? "Mitigar" : "Aprovechar"); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${tipo === t ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Programa *</label>
              <select className={inp} value={form.programa} onChange={e => set("programa", e.target.value)}>
                {PROGRAMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Proceso / Área *</label>
              <input className={inp} placeholder="ej. Producción" value={form.proceso} onChange={e => set("proceso", e.target.value)} required />
            </div>
          </div>

          <div>
            <label className={lbl}>Descripción *</label>
            <textarea className={inp} rows={2} placeholder="Describe el riesgo u oportunidad" value={form.descripcion} onChange={e => set("descripcion", e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Causas</label>
              <textarea className={inp} rows={2} value={form.causas} onChange={e => set("causas", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Consecuencias</label>
              <textarea className={inp} rows={2} value={form.consecuencias} onChange={e => set("consecuencias", e.target.value)} />
            </div>
          </div>

          {/* Probabilidad e Impacto */}
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className={lbl}>Probabilidad (1-5) *</label>
              <div className="flex gap-1">
                {SCALE.map(n => (
                  <button key={n} type="button" onClick={() => set("probabilidad", String(n))}
                    className={`flex-1 py-1.5 rounded text-sm font-semibold border transition-colors ${form.probabilidad === String(n) ? "bg-[#C41230] text-white border-[#C41230]" : "border-zinc-200 text-zinc-600 hover:border-[#C41230]"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl}>Impacto (1-5) *</label>
              <div className="flex gap-1">
                {SCALE.map(n => (
                  <button key={n} type="button" onClick={() => set("impacto", String(n))}
                    className={`flex-1 py-1.5 rounded text-sm font-semibold border transition-colors ${form.impacto === String(n) ? "bg-[#C41230] text-white border-[#C41230]" : "border-zinc-200 text-zinc-600 hover:border-[#C41230]"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl}>Nivel</label>
              <div className={`rounded-lg px-3 py-2 text-sm font-bold border text-center ${CLASIF_COLOR[previewClasif]}`}>
                {parseInt(form.probabilidad) * parseInt(form.impacto)} — {previewClasif}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tratamiento</label>
              <select className={inp} value={form.tratamiento} onChange={e => set("tratamiento", e.target.value)}>
                {(tipo === "Riesgo" ? TRATAMIENTOS_RIESGO : TRATAMIENTOS_OPP).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Responsable</label>
              <input className={inp} value={form.responsable} onChange={e => set("responsable", e.target.value)} />
            </div>
          </div>

          <div>
            <label className={lbl}>Acción de control</label>
            <textarea className={inp} rows={2} value={form.accionControl} onChange={e => set("accionControl", e.target.value)} />
          </div>

          <div>
            <label className={lbl}>Fecha de revisión</label>
            <input className={inp} type="date" value={form.fechaRevision} onChange={e => set("fechaRevision", e.target.value)} />
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
  item: RO; isAdmin: boolean; onClose: () => void; onUpdated: (item: RO) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [estado, setEstado] = useState(item.estado);
  const [accionControl, setAccionControl] = useState(item.accionControl ?? "");
  const [responsable, setResponsable] = useState(item.responsable ?? "");
  const [probR, setProbR] = useState(String(item.probabilidadR ?? ""));
  const [impR, setImpR] = useState(String(item.impactoR ?? ""));

  const nivelR = probR && impR ? parseInt(probR) * parseInt(impR) : null;
  const clasifR = nivelR !== null ? clasificar(parseInt(probR), parseInt(impR)) : null;

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/estrategia-riesgos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, estado, accionControl, responsable, probabilidadR: probR || undefined, impactoR: impR || undefined }),
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
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROGRAMA_COLOR[item.programa]}`}>{item.programa}</span>
            <span className="text-xs text-zinc-400">{item.tipo} RO-{String(item.numero).padStart(3, "0")}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CLASIF_COLOR[item.clasificacion]}`}>{item.clasificacion}</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide">Proceso</p>
            <p className="text-sm font-medium text-zinc-800">{item.proceso}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide">Descripción</p>
            <p className="text-sm text-zinc-700">{item.descripcion}</p>
          </div>
          {item.causas && <div><p className="text-xs text-zinc-400 uppercase tracking-wide">Causas</p><p className="text-sm text-zinc-700">{item.causas}</p></div>}
          {item.consecuencias && <div><p className="text-xs text-zinc-400 uppercase tracking-wide">Consecuencias</p><p className="text-sm text-zinc-700">{item.consecuencias}</p></div>}

          {/* Nivel inherente */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-zinc-50 rounded-lg px-3 py-2">
              <p className="text-xs text-zinc-400">Probabilidad</p>
              <p className="text-xl font-bold text-zinc-800">{item.probabilidad}</p>
            </div>
            <div className="bg-zinc-50 rounded-lg px-3 py-2">
              <p className="text-xs text-zinc-400">Impacto</p>
              <p className="text-xl font-bold text-zinc-800">{item.impacto}</p>
            </div>
            <div className={`rounded-lg px-3 py-2 border ${CLASIF_COLOR[item.clasificacion]}`}>
              <p className="text-xs opacity-70">Nivel</p>
              <p className="text-xl font-bold">{item.nivelRiesgo}</p>
            </div>
          </div>

          {/* Nivel residual si existe */}
          {item.probabilidadR && item.impactoR && (
            <div className="bg-zinc-50 rounded-lg px-4 py-3">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Riesgo residual (post-control)</p>
              <div className="flex gap-4 text-sm">
                <span>P: <strong>{item.probabilidadR}</strong></span>
                <span>I: <strong>{item.impactoR}</strong></span>
                <span>Nivel: <strong>{item.probabilidadR * item.impactoR}</strong></span>
                <span className={`font-semibold ${CLASIF_DOT[clasificar(item.probabilidadR, item.impactoR)] ? "" : ""}`}>{clasificar(item.probabilidadR, item.impactoR)}</span>
              </div>
            </div>
          )}

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
                  <label className={lbl}>Responsable</label>
                  <input className={inp} value={responsable} onChange={e => setResponsable(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={lbl}>Acción de control</label>
                <textarea className={inp} rows={2} value={accionControl} onChange={e => setAccionControl(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Riesgo residual — Probabilidad y Impacto post-control</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-zinc-400 mb-1">Probabilidad</p>
                    <div className="flex gap-1">
                      {SCALE.map(n => (
                        <button key={n} type="button" onClick={() => setProbR(String(n))}
                          className={`flex-1 py-1 rounded text-xs font-semibold border transition-colors ${probR === String(n) ? "bg-[#C41230] text-white border-[#C41230]" : "border-zinc-200 text-zinc-600"}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-400 mb-1">Impacto</p>
                    <div className="flex gap-1">
                      {SCALE.map(n => (
                        <button key={n} type="button" onClick={() => setImpR(String(n))}
                          className={`flex-1 py-1 rounded text-xs font-semibold border transition-colors ${impR === String(n) ? "bg-[#C41230] text-white border-[#C41230]" : "border-zinc-200 text-zinc-600"}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {nivelR !== null && clasifR && (
                    <div className={`self-end rounded-lg px-3 py-1.5 text-sm font-bold border ${CLASIF_COLOR[clasifR]}`}>
                      {nivelR} — {clasifR}
                    </div>
                  )}
                </div>
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
export default function EstrategiaRiesgosClient({ items: initial, isAdmin }: { items: RO[]; isAdmin: boolean }) {
  const [items, setItems] = useState<RO[]>(initial);
  const [showRegistro, setShowRegistro] = useState(false);
  const [selected, setSelected] = useState<RO | null>(null);
  const [filTipo, setFilTipo] = useState("Todos");
  const [filPrograma, setFilPrograma] = useState("Todos");
  const [filClasif, setFilClasif] = useState("Todos");
  const [vista, setVista] = useState<"lista" | "matriz">("lista");

  const riesgos = items.filter(i => i.tipo === "Riesgo");

  const filtered = items.filter(i => {
    if (filTipo !== "Todos" && i.tipo !== filTipo) return false;
    if (filPrograma !== "Todos" && i.programa !== filPrograma) return false;
    if (filClasif !== "Todos" && i.clasificacion !== filClasif) return false;
    return true;
  });

  // KPIs
  const criticos = riesgos.filter(i => i.clasificacion === "Crítico" && i.estado !== "Cerrado").length;
  const altos = riesgos.filter(i => i.clasificacion === "Alto" && i.estado !== "Cerrado").length;
  const enTratamiento = riesgos.filter(i => i.estado === "En tratamiento").length;
  const oportunidades = items.filter(i => i.tipo === "Oportunidad").length;

  function handleSaved(item: RO) {
    setItems(prev => [item, ...prev]);
    setShowRegistro(false);
  }

  function handleUpdated(updated: RO) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    setSelected(updated);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Estrategia y Riesgos</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Matriz de riesgos y oportunidades del SIG</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVista(v => v === "lista" ? "matriz" : "lista")}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600">
            {vista === "lista" ? "Ver matriz" : "Ver lista"}
          </button>
          {isAdmin && (
            <button onClick={() => setShowRegistro(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26]">
              <span className="text-base leading-none">+</span> Nuevo
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Críticos activos", value: criticos, color: "text-red-600" },
          { label: "Altos activos", value: altos, color: "text-orange-500" },
          { label: "En tratamiento", value: enTratamiento, color: "text-blue-600" },
          { label: "Oportunidades", value: oportunidades, color: "text-emerald-600" },
        ].map(k => (
          <div key={k.label} className="bg-white border border-zinc-100 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-400 uppercase tracking-wide">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Matriz visual (toggle) */}
      {vista === "matriz" && <MatrizRiesgo items={items} />}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        {["Todos", ...TIPOS].map(t => (
          <button key={t} onClick={() => setFilTipo(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filTipo === t ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
            {t}
          </button>
        ))}
        <span className="text-zinc-200">|</span>
        {["Todos", ...PROGRAMAS].map(p => (
          <button key={p} onClick={() => setFilPrograma(p)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filPrograma === p ? "bg-zinc-700 text-white border-zinc-700" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}>
            {p}
          </button>
        ))}
        <span className="text-zinc-200">|</span>
        {["Todos", "Crítico", "Alto", "Medio", "Bajo"].map(c => (
          <button key={c} onClick={() => setFilClasif(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filClasif === c ? "bg-zinc-600 text-white border-zinc-600" : "bg-white text-zinc-600 border-zinc-200"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">No hay registros para este filtro.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <button key={item.id} onClick={() => setSelected(item)}
              className="w-full text-left bg-white border border-zinc-100 rounded-xl px-5 py-4 hover:border-[#C41230]/40 hover:shadow-sm transition-all">
              <div className="flex items-start gap-3 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROGRAMA_COLOR[item.programa]}`}>{item.programa}</span>
                    <span className="text-xs text-zinc-400">{item.tipo} RO-{String(item.numero).padStart(3, "0")}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[item.estado] ?? "bg-zinc-100 text-zinc-500"}`}>{item.estado}</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-800">{item.proceso}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{item.descripcion}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${CLASIF_COLOR[item.clasificacion]}`}>{item.clasificacion}</span>
                  <span className="text-xs text-zinc-400 font-semibold">{item.probabilidad} × {item.impacto} = {item.nivelRiesgo}</span>
                  {item.tratamiento && <span className="text-xs text-zinc-400">{item.tratamiento}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showRegistro && <RegistroModal onClose={() => setShowRegistro(false)} onSaved={handleSaved} />}
      {selected && <DetalleModal item={selected} isAdmin={isAdmin} onClose={() => setSelected(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
