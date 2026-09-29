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

export default function PestelTab({ items: initial, isAdmin, onChanged }: { items: Pestel[]; isAdmin: boolean; onChanged: (items: Pestel[]) => void }) {
  const [items, setItems] = useState<Pestel[]>(initial);
  const [showNuevo, setShowNuevo] = useState(false);
  const [filSistema, setFilSistema] = useState("Todos");
  const [filCategoria, setFilCategoria] = useState("Todas");

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-zinc-500">Análisis de factores externos (cláusula 4.1) — Político, Económico, Social, Tecnológico, Ambiental y Legal.</p>
        {isAdmin && (
          <button onClick={() => setShowNuevo(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26]">
            <span className="text-base leading-none">+</span> Nuevo factor
          </button>
        )}
      </div>

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
                  <button onClick={() => handleDelete(item.id)} className="text-zinc-300 hover:text-red-500 text-lg leading-none shrink-0">×</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showNuevo && <NuevoModal onClose={() => setShowNuevo(false)} onSaved={handleSaved} />}
    </div>
  );
}
