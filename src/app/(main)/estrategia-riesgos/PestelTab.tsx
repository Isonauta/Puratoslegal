"use client";

import { useState } from "react";

const CATEGORIAS = ["Político", "Económico", "Social", "Tecnológico", "Ambiental", "Legal"];
const SISTEMAS = ["SST", "MA"];
const CLASIFICACIONES = ["Oportunidad", "Amenaza"];

const CLASIF_COLOR: Record<string, string> = {
  Oportunidad: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Amenaza: "bg-red-100 text-red-700 border-red-200",
};

const RELEVANCIA_COLOR: Record<string, string> = {
  Alta: "bg-red-50 text-red-600",
  Media: "bg-yellow-50 text-yellow-600",
  Baja: "bg-zinc-100 text-zinc-500",
};

export interface Pestel {
  id: string;
  categoria: string;
  subFactor: string | null;
  descripcion: string;
  sistema: string;
  clasificacion: string;
  texto: string;
  impactoTexto: string | null;
  tipoImpacto: string | null;
  relevancia: string | null;
  createdAt: string;
}

function NuevoModal({ onClose, onSaved }: { onClose: () => void; onSaved: (item: Pestel) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    categoria: "Político", subFactor: "", descripcion: "", sistema: "SST",
    clasificacion: "Oportunidad", texto: "", impactoTexto: "", tipoImpacto: "", relevancia: "Media",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/pestel", {
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
          <h2 className="text-base font-semibold text-zinc-900">Nuevo Factor PESTEL</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Categoría *</label>
              <select className={inp} value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Sub-factor</label>
              <input className={inp} value={form.subFactor} onChange={(e) => set("subFactor", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl}>Descripción / situación actual *</label>
            <textarea className={inp} rows={2} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Sistema *</label>
              <select className={inp} value={form.sistema} onChange={(e) => set("sistema", e.target.value)}>
                {SISTEMAS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Clasificación *</label>
              <select className={inp} value={form.clasificacion} onChange={(e) => set("clasificacion", e.target.value)}>
                {CLASIFICACIONES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Texto ({form.clasificacion.toLowerCase()}) *</label>
            <textarea className={inp} rows={2} value={form.texto} onChange={(e) => set("texto", e.target.value)} required />
          </div>
          <div>
            <label className={lbl}>Impacto en el sistema (opcional)</label>
            <textarea className={inp} rows={2} value={form.impactoTexto} onChange={(e) => set("impactoTexto", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tipo de impacto</label>
              <input className={inp} placeholder="ej. Financiero, Legal" value={form.tipoImpacto} onChange={(e) => set("tipoImpacto", e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Relevancia</label>
              <select className={inp} value={form.relevancia} onChange={(e) => set("relevancia", e.target.value)}>
                {["Alta", "Media", "Baja"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
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

interface Generado {
  categoria: string; subFactor: string | null; descripcion: string; sistema: string;
  clasificacion: string; texto: string; impactoTexto: string | null; tipoImpacto: string | null; relevancia: string | null;
}

function RevisarGeneradosModal({ rows, onClose, onApplied }: {
  rows: Generado[]; onClose: () => void; onApplied: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set(rows.map((_, i) => i)));
  const [saving, setSaving] = useState(false);

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  async function handleApply() {
    const toApply = rows.filter((_, i) => selected.has(i));
    if (toApply.length === 0) return;
    setSaving(true);
    await fetch("/api/pestel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bulk: toApply }),
    });
    onApplied();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Revisar factores generados</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Desmarca lo que no aplique antes de incorporar — no se guarda nada hasta que confirmes.</p>
          </div>
          <span className="text-xs font-mono text-[#C41230] font-semibold shrink-0">{selected.size} de {rows.length}</span>
        </div>
        <div className="px-6 py-4 space-y-2 max-h-[55vh] overflow-y-auto">
          {rows.map((r, i) => {
            const isSelected = selected.has(i);
            return (
              <div key={i} onClick={() => toggle(i)}
                className={`p-3 rounded-lg border text-sm cursor-pointer transition-colors ${isSelected ? "border-[#C41230] bg-[#C41230]/5" : "border-zinc-200 hover:border-zinc-300"}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isSelected ? "bg-[#C41230] text-white" : "border border-zinc-300"}`}>
                      {isSelected && <span className="text-[10px] leading-none">✓</span>}
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{r.categoria}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{r.sistema}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CLASIF_COLOR[r.clasificacion]}`}>{r.clasificacion}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 pl-6">{r.descripcion}</p>
                <p className="text-sm font-medium text-zinc-800 pl-6">{r.texto}</p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Descartar todo</button>
          <button onClick={handleApply} disabled={saving || selected.size === 0}
            className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
            {saving ? "Incorporando…" : `Incorporar ${selected.size} seleccionados`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PestelTab({ items: initial, isAdmin, onChanged, contexto, fodaOrigenIds }: {
  items: Pestel[]; isAdmin: boolean; onChanged: (items: Pestel[]) => void;
  contexto: { rubro: string; ubicaciones: string; tipoClientes: string; mercado: string; adicional: string };
  fodaOrigenIds: Set<string>;
}) {
  const [items, setItems] = useState<Pestel[]>(initial);
  const [showNuevo, setShowNuevo] = useState(false);
  const [filSistema, setFilSistema] = useState("Todos");
  const [filCategoria, setFilCategoria] = useState("Todas");
  const [generando, setGenerando] = useState(false);
  const [generarError, setGenerarError] = useState<string | null>(null);
  const [agregandoFoda, setAgregandoFoda] = useState<string | null>(null);
  const [agregandoTodo, setAgregandoTodo] = useState(false);
  const [generados, setGenerados] = useState<Generado[] | null>(null);

  const filtered = items.filter((i) => {
    if (filSistema !== "Todos" && i.sistema !== filSistema) return false;
    if (filCategoria !== "Todas" && i.categoria !== filCategoria) return false;
    return true;
  });

  function handleSaved(item: Pestel) {
    const next = [item, ...items];
    setItems(next);
    onChanged(next);
    setShowNuevo(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este factor PESTEL? Los ítems FODA vinculados quedarán sin origen.")) return;
    const res = await fetch(`/api/pestel?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      const next = items.filter((i) => i.id !== id);
      setItems(next);
      onChanged(next);
    }
  }

  async function handleGenerar() {
    if (!contexto.rubro.trim()) {
      setGenerarError('Completa al menos "Rubro / Actividad" en la pestaña Contexto antes de generar.');
      return;
    }
    setGenerando(true);
    setGenerarError(null);
    const res = await fetch("/api/pestel/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contexto),
    });
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.warning) alert(body.warning);
      setGenerados(body.rows ?? []);
      setGenerando(false);
    } else {
      const body = await res.json().catch(() => ({}));
      setGenerarError(body.error ?? "No se pudo generar el análisis PESTEL (sin detalle — probablemente un timeout).");
      setGenerando(false);
    }
  }

  async function handleAgregarTodoAFoda() {
    const pendientes = items.filter((i) => !fodaOrigenIds.has(i.id));
    if (pendientes.length === 0) return;
    if (!confirm(`¿Agregar los ${pendientes.length} factores pendientes a FODA?`)) return;
    setAgregandoTodo(true);
    await fetch("/api/foda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bulk: pendientes.map((item) => ({
          sistema: item.sistema,
          ambito: "EXTERNAS",
          cuestion: item.categoria,
          cuadrante: item.clasificacion === "Oportunidad" ? "Oportunidad" : "Amenaza",
          descripcion: item.texto,
          tipoImpacto: item.tipoImpacto,
          origenPestelId: item.id,
        })),
      }),
    });
    window.location.reload();
  }

  async function handleAgregarFoda(item: Pestel) {
    setAgregandoFoda(item.id);
    await fetch("/api/foda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sistema: item.sistema,
        ambito: "EXTERNAS",
        cuestion: item.categoria,
        cuadrante: item.clasificacion === "Oportunidad" ? "Oportunidad" : "Amenaza",
        descripcion: item.texto,
        tipoImpacto: item.tipoImpacto,
        origenPestelId: item.id,
      }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-zinc-500">Análisis de factores externos (cláusula 4.1) — Político, Económico, Social, Tecnológico, Ambiental y Legal.</p>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={handleGenerar} disabled={generando}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
              <span className="text-base leading-none">✦</span> {generando ? "Generando…" : "Generar análisis PESTEL con IA"}
            </button>
            <button onClick={() => setShowNuevo(true)} className="px-4 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600">
              + Nuevo factor
            </button>
            {items.some((i) => !fodaOrigenIds.has(i.id)) && (
              <button onClick={handleAgregarTodoAFoda} disabled={agregandoTodo}
                className="px-4 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600 disabled:opacity-60">
                {agregandoTodo ? "Agregando…" : "Agregar todo a FODA"}
              </button>
            )}
          </div>
        )}
      </div>
      {generarError && <p className="text-sm text-red-600">{generarError}</p>}

      <div className="flex flex-wrap gap-2 items-center">
        {["Todos", ...SISTEMAS].map((s) => (
          <button key={s} onClick={() => setFilSistema(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filSistema === s ? "bg-zinc-700 text-white border-zinc-700" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}>
            {s}
          </button>
        ))}
        <span className="text-zinc-200">|</span>
        {["Todas", ...CATEGORIAS].map((c) => (
          <button key={c} onClick={() => setFilCategoria(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filCategoria === c ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">No hay factores PESTEL cargados para este filtro.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-zinc-100 rounded-xl px-5 py-4">
              <div className="flex items-start gap-3 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">{item.categoria}</span>
                    {item.subFactor && <span className="text-xs text-zinc-400">{item.subFactor}</span>}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{item.sistema}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${CLASIF_COLOR[item.clasificacion]}`}>{item.clasificacion}</span>
                    {item.relevancia && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RELEVANCIA_COLOR[item.relevancia] ?? "bg-zinc-100 text-zinc-500"}`}>Relevancia {item.relevancia}</span>}
                  </div>
                  <p className="text-sm text-zinc-500 mb-1">{item.descripcion}</p>
                  <p className="text-sm font-medium text-zinc-800">{item.texto}</p>
                  {item.tipoImpacto && <p className="text-xs text-zinc-400 mt-1">Impacto: {item.tipoImpacto}</p>}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    {fodaOrigenIds.has(item.id) ? (
                      <span className="text-xs font-medium px-2.5 py-1.5 rounded-lg text-emerald-600">✓ En FODA</span>
                    ) : (
                      <button onClick={() => handleAgregarFoda(item)} disabled={agregandoFoda === item.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-[#C41230] hover:text-[#C41230] disabled:opacity-60">
                        {agregandoFoda === item.id ? "Agregando…" : "+ Agregar a FODA"}
                      </button>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="text-zinc-300 hover:text-red-500 text-lg leading-none">×</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNuevo && <NuevoModal onClose={() => setShowNuevo(false)} onSaved={handleSaved} />}
      {generados && (
        <RevisarGeneradosModal
          rows={generados}
          onClose={() => setGenerados(null)}
          onApplied={() => window.location.reload()}
        />
      )}
    </div>
  );
}
