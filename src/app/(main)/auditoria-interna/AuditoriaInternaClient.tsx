"use client";

import { useState } from "react";

const PROGRAMAS = ["SST", "MA", "SGI", "Integrada"];
const TIPOS = ["Interna", "Externa"];
const ESTADOS = ["Planificada", "En curso", "Realizada", "Cancelada"];

const ESTADO_COLOR: Record<string, string> = {
  Planificada: "bg-blue-50 text-blue-600",
  "En curso": "bg-yellow-50 text-yellow-700",
  Realizada: "bg-green-50 text-green-700",
  Cancelada: "bg-zinc-100 text-zinc-500",
};

const PROGRAMA_COLOR: Record<string, string> = {
  SST: "bg-orange-100 text-orange-700",
  MA: "bg-emerald-100 text-emerald-700",
  SGI: "bg-violet-100 text-violet-700",
  Integrada: "bg-sky-100 text-sky-700",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

interface Auditoria {
  id: string;
  numero: number;
  titulo: string;
  programa: string;
  tipo: string;
  alcance: string | null;
  auditores: string | null;
  auditado: string | null;
  fechaPlan: string;
  fechaReal: string | null;
  estado: string;
  hallazgos: string | null;
  noConformidades: number;
  noConformidadesAbiertas: number;
  noConformidadesCerradas: number;
  observaciones: number;
  oportunidades: number;
  conclusion: string | null;
  evidencia: string | null;
  proximaAuditoria: string | null;
  createdAt: string;
}

// ── Modal Registro ──────────────────────────────────────────────────────────
function RegistroModal({ onClose, onSaved }: { onClose: () => void; onSaved: (item: Auditoria) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: "", programa: "SST", tipo: "Interna",
    alcance: "", auditores: "", auditado: "",
    fechaPlan: "", proximaAuditoria: "",
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/auditoria-interna", {
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
          <h2 className="text-base font-semibold text-zinc-900">Planificar Auditoría</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Título *</label>
            <input className={inp} placeholder="ej. Auditoría SST ISO 45001 Q1 2026" value={form.titulo} onChange={e => set("titulo", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Programa</label>
              <select className={inp} value={form.programa} onChange={e => set("programa", e.target.value)}>
                {PROGRAMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Tipo</label>
              <select className={inp} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Alcance</label>
            <textarea className={inp} rows={2} placeholder="Procesos y áreas incluidos" value={form.alcance} onChange={e => set("alcance", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Auditores</label>
              <input className={inp} placeholder="Nombres separados por coma" value={form.auditores} onChange={e => set("auditores", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Área / Proceso auditado</label>
              <input className={inp} placeholder="ej. Producción, RRHH" value={form.auditado} onChange={e => set("auditado", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Fecha planificada *</label>
              <input className={inp} type="date" value={form.fechaPlan} onChange={e => set("fechaPlan", e.target.value)} required />
            </div>
            <div>
              <label className={lbl}>Próxima auditoría</label>
              <input className={inp} type="date" value={form.proximaAuditoria} onChange={e => set("proximaAuditoria", e.target.value)} />
            </div>
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
  item: Auditoria; isAdmin: boolean; onClose: () => void; onUpdated: (item: Auditoria) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [estado, setEstado] = useState(item.estado);
  const [fechaReal, setFechaReal] = useState(item.fechaReal ? item.fechaReal.slice(0, 10) : "");
  const [hallazgos, setHallazgos] = useState(item.hallazgos ?? "");
  const [ncs, setNcs] = useState(String(item.noConformidades));
  const [ncsAbiertas, setNcsAbiertas] = useState(String(item.noConformidadesAbiertas));
  const [ncsCerradas, setNcsCerradas] = useState(String(item.noConformidadesCerradas));
  const [obs, setObs] = useState(String(item.observaciones));
  const [opps, setOpps] = useState(String(item.oportunidades));
  const [conclusion, setConclusion] = useState(item.conclusion ?? "");
  const [evidencia, setEvidencia] = useState(item.evidencia ?? "");
  const [proximaAuditoria, setProximaAuditoria] = useState(item.proximaAuditoria ? item.proximaAuditoria.slice(0, 10) : "");

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/auditoria-interna", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id, estado, fechaReal: fechaReal || null, hallazgos,
        noConformidades: ncs, noConformidadesAbiertas: ncsAbiertas, noConformidadesCerradas: ncsCerradas,
        observaciones: obs, oportunidades: opps, conclusion, evidencia,
        proximaAuditoria: proximaAuditoria || null,
      }),
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
            <span className="text-xs text-zinc-400">AUD-{String(item.numero).padStart(3, "0")} · {item.tipo}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[item.estado] ?? "bg-zinc-100 text-zinc-500"}`}>{item.estado}</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-base font-semibold text-zinc-900">{item.titulo}</p>
          {item.alcance && <div><p className="text-xs text-zinc-400 uppercase tracking-wide">Alcance</p><p className="text-sm text-zinc-700">{item.alcance}</p></div>}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {item.auditores && <div><span className="text-zinc-400">Auditores: </span><span className="text-zinc-700">{item.auditores}</span></div>}
            {item.auditado && <div><span className="text-zinc-400">Auditado: </span><span className="text-zinc-700">{item.auditado}</span></div>}
            <div><span className="text-zinc-400">Fecha plan: </span><span className="text-zinc-700">{fmt(item.fechaPlan)}</span></div>
            {item.fechaReal && <div><span className="text-zinc-400">Fecha real: </span><span className="text-zinc-700">{fmt(item.fechaReal)}</span></div>}
          </div>

          {/* Conteos de hallazgos */}
          {item.estado === "Realizada" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-red-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-red-400">NC Abiertas</p>
                  <p className="text-2xl font-bold text-red-600">{item.noConformidadesAbiertas}</p>
                </div>
                <div className="bg-green-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-green-500">NC Cerradas</p>
                  <p className="text-2xl font-bold text-green-600">{item.noConformidadesCerradas}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-yellow-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-yellow-500">Observaciones</p>
                  <p className="text-2xl font-bold text-yellow-600">{item.observaciones}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-emerald-500">Oportunidades</p>
                  <p className="text-2xl font-bold text-emerald-600">{item.oportunidades}</p>
                </div>
              </div>
            </div>
          )}

          {item.hallazgos && <div><p className="text-xs text-zinc-400 uppercase tracking-wide">Hallazgos</p><p className="text-sm text-zinc-700 whitespace-pre-wrap">{item.hallazgos}</p></div>}
          {item.conclusion && <div><p className="text-xs text-zinc-400 uppercase tracking-wide">Conclusión</p><p className="text-sm text-zinc-700">{item.conclusion}</p></div>}
          {item.proximaAuditoria && <p className="text-xs text-zinc-400">Próxima auditoría: {fmt(item.proximaAuditoria)}</p>}

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
              <div>
                <label className={lbl}>Hallazgos</label>
                <textarea className={inp} rows={3} placeholder="Describe los hallazgos de la auditoría" value={hallazgos} onChange={e => setHallazgos(e.target.value)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>NC total</label>
                  <input className={inp} type="number" min="0" value={ncs} onChange={e => setNcs(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>NC abiertas</label>
                  <input className={inp} type="number" min="0" value={ncsAbiertas} onChange={e => setNcsAbiertas(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>NC cerradas</label>
                  <input className={inp} type="number" min="0" value={ncsCerradas} onChange={e => setNcsCerradas(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Observaciones</label>
                  <input className={inp} type="number" min="0" value={obs} onChange={e => setObs(e.target.value)} />
                </div>
                <div>
                  <label className={lbl}>Oportunidades</label>
                  <input className={inp} type="number" min="0" value={opps} onChange={e => setOpps(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={lbl}>Conclusión</label>
                <textarea className={inp} rows={2} value={conclusion} onChange={e => setConclusion(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Evidencia</label>
                <input className={inp} placeholder="URL o descripción del informe" value={evidencia} onChange={e => setEvidencia(e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Próxima auditoría</label>
                <input className={inp} type="date" value={proximaAuditoria} onChange={e => setProximaAuditoria(e.target.value)} />
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
export default function AuditoriaInternaClient({ items: initial, isAdmin }: { items: Auditoria[]; isAdmin: boolean }) {
  const [items, setItems] = useState<Auditoria[]>(initial);
  const [showRegistro, setShowRegistro] = useState(false);
  const [selected, setSelected] = useState<Auditoria | null>(null);
  const [filEstado, setFilEstado] = useState("Todos");
  const [filPrograma, setFilPrograma] = useState("Todos");
  const [filTipo, setFilTipo] = useState("Todos");

  const filtered = items.filter(i => {
    if (filEstado !== "Todos" && i.estado !== filEstado) return false;
    if (filPrograma !== "Todos" && i.programa !== filPrograma) return false;
    if (filTipo !== "Todos" && i.tipo !== filTipo) return false;
    return true;
  });

  // KPIs
  const planificadas = items.filter(i => i.estado === "Planificada").length;
  const realizadas = items.filter(i => i.estado === "Realizada").length;
  const ncAbiertas = items.filter(i => i.estado === "Realizada").reduce((s, i) => s + i.noConformidadesAbiertas, 0);
  const ncCerradas = items.filter(i => i.estado === "Realizada").reduce((s, i) => s + i.noConformidadesCerradas, 0);
  const totalObs = items.filter(i => i.estado === "Realizada").reduce((s, i) => s + i.observaciones, 0);

  function handleSaved(item: Auditoria) {
    setItems(prev => [item, ...prev]);
    setShowRegistro(false);
  }

  function handleUpdated(updated: Auditoria) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    setSelected(updated);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Auditoría Interna</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Plan de auditorías y seguimiento de hallazgos</p>
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
          { label: "NC abiertas", value: ncAbiertas, color: ncAbiertas > 0 ? "text-red-600" : "text-zinc-800" },
          { label: "NC cerradas", value: ncCerradas, color: "text-green-600" },
        ].map(k => (
          <div key={k.label} className="bg-white border border-zinc-100 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-400 uppercase tracking-wide">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Observaciones totales", value: totalObs, color: "text-yellow-600" },
          { label: "Internas / Externas", value: `${items.filter(i => i.tipo === "Interna").length} / ${items.filter(i => i.tipo === "Externa").length}`, color: "text-zinc-800" },
        ].map(k => (
          <div key={k.label} className="bg-white border border-zinc-100 rounded-xl px-4 py-3">
            <p className="text-xs text-zinc-400 uppercase tracking-wide">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
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
        <span className="text-zinc-200">|</span>
        {["Todos", ...TIPOS].map(t => (
          <button key={t} onClick={() => setFilTipo(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filTipo === t ? "bg-sky-600 text-white border-sky-600" : "bg-white text-zinc-600 border-zinc-200 hover:border-sky-400"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">No hay auditorías para este filtro.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <button key={item.id} onClick={() => setSelected(item)}
              className="w-full text-left bg-white border border-zinc-100 rounded-xl px-5 py-4 hover:border-[#C41230]/40 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROGRAMA_COLOR[item.programa] ?? "bg-zinc-100 text-zinc-600"}`}>{item.programa}</span>
                    <span className="text-xs text-zinc-400">AUD-{String(item.numero).padStart(3, "0")} · {item.tipo}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[item.estado] ?? "bg-zinc-100 text-zinc-500"}`}>{item.estado}</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-800">{item.titulo}</p>
                  <div className="flex gap-3 mt-1 text-xs text-zinc-400 flex-wrap">
                    {item.auditado && <span>Auditado: {item.auditado}</span>}
                    {item.auditores && <span>· Auditores: {item.auditores}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <p className="text-xs text-zinc-500">{fmt(item.fechaPlan)}</p>
                  {item.estado === "Realizada" && (item.noConformidades > 0 || item.observaciones > 0) && (
                    <div className="flex gap-2 justify-end">
                      {item.noConformidades > 0 && <span className="text-xs font-semibold text-red-500">{item.noConformidades} NC</span>}
                      {item.observaciones > 0 && <span className="text-xs font-semibold text-yellow-600">{item.observaciones} Obs</span>}
                    </div>
                  )}
                  {item.proximaAuditoria && <p className="text-xs text-zinc-400">Próxima: {fmt(item.proximaAuditoria)}</p>}
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
