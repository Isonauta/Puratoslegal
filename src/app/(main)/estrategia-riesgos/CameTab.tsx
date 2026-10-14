"use client";

import { useState } from "react";
import type { Foda } from "./FodaTab";

const SISTEMAS = ["SST", "MA"];
const TIPOS = ["FO", "FA", "DO", "DA"] as const;

const TIPO_INFO: Record<(typeof TIPOS)[number], { label: string; desc: string; color: string }> = {
  FO: { label: "Explotar", desc: "Fortalezas + Oportunidades", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  FA: { label: "Afrontar", desc: "Fortalezas + Amenazas", color: "bg-blue-50 border-blue-200 text-blue-700" },
  DO: { label: "Corregir", desc: "Debilidades + Oportunidades", color: "bg-amber-50 border-amber-200 text-amber-700" },
  DA: { label: "Mantener / Defensiva", desc: "Debilidades + Amenazas", color: "bg-red-50 border-red-200 text-red-700" },
};

const PRIORIDAD_COLOR: Record<string, string> = {
  Alta: "bg-red-50 text-red-600",
  Media: "bg-yellow-50 text-yellow-600",
  Baja: "bg-zinc-100 text-zinc-500",
};

export interface Came {
  id: string;
  numero: number;
  sistema: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  itemsFoda: string | null;
  responsable: string | null;
  prioridad: string;
  createdAt: string;
}

function NuevoModal({ onClose, onSaved }: { onClose: () => void; onSaved: (item: Came) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sistema: "SST", tipo: "FO" as string, titulo: "", descripcion: "",
    itemsFoda: "", responsable: "", prioridad: "Media",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/came", {
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">Nueva Estrategia CAME</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {TIPOS.map((t) => (
              <button key={t} type="button" onClick={() => set("tipo", t)}
                className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${form.tipo === t ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400 -mt-2">{TIPO_INFO[form.tipo as keyof typeof TIPO_INFO].label} — {TIPO_INFO[form.tipo as keyof typeof TIPO_INFO].desc}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Sistema *</label>
              <select className={inp} value={form.sistema} onChange={(e) => set("sistema", e.target.value)}>
                {SISTEMAS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Prioridad</label>
              <select className={inp} value={form.prioridad} onChange={(e) => set("prioridad", e.target.value)}>
                {["Alta", "Media", "Baja"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Título *</label>
            <input className={inp} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} required />
          </div>
          <div>
            <label className={lbl}>Estrategia / Descripción *</label>
            <textarea className={inp} rows={3} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} required />
          </div>
          <div>
            <label className={lbl}>Ítems FODA que cruza</label>
            <textarea className={inp} rows={2} placeholder="ej. Fortaleza: certificación ISO... + Oportunidad: nuevo mercado..." value={form.itemsFoda} onChange={(e) => set("itemsFoda", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Responsable</label>
            <input className={inp} value={form.responsable} onChange={(e) => set("responsable", e.target.value)} />
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
  sistema: string; tipo: string; titulo: string; descripcion: string; itemsFoda: string | null; prioridad: string;
}

function RevisarGeneradosModal({ rows, onClose, onApplied }: { rows: Generado[]; onClose: () => void; onApplied: () => void }) {
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
    await fetch("/api/came", {
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
            <h2 className="text-base font-semibold text-zinc-900">Revisar estrategias CAME generadas</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Desmarca lo que no aplique antes de incorporar — no se guarda nada hasta que confirmes.</p>
          </div>
          <span className="text-xs font-mono text-[#C41230] font-semibold shrink-0">{selected.size} de {rows.length}</span>
        </div>
        <div className="px-6 py-4 space-y-2 max-h-[55vh] overflow-y-auto">
          {rows.map((r, i) => {
            const isSelected = selected.has(i);
            const info = TIPO_INFO[r.tipo as keyof typeof TIPO_INFO];
            return (
              <div key={i} onClick={() => toggle(i)}
                className={`p-3 rounded-lg border text-sm cursor-pointer transition-colors ${isSelected ? "border-[#C41230] bg-[#C41230]/5" : "border-zinc-200 hover:border-zinc-300"}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${isSelected ? "bg-[#C41230] text-white" : "border border-zinc-300"}`}>
                      {isSelected && <span className="text-[10px] leading-none">✓</span>}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${info?.color ?? "bg-zinc-100"}`}>{r.tipo} · {info?.label}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{r.sistema}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-zinc-800 pl-6">{r.titulo}</p>
                <p className="text-xs text-zinc-500 pl-6 mt-0.5">{r.descripcion}</p>
                {r.itemsFoda && <p className="text-xs text-zinc-400 pl-6 mt-1">↳ {r.itemsFoda}</p>}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-100">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Descartar todo</button>
          <button onClick={handleApply} disabled={saving || selected.size === 0}
            className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
            {saving ? "Incorporando…" : `Incorporar ${selected.size} seleccionadas`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CameTab({ items: initial, foda, isAdmin, onChanged }: {
  items: Came[]; foda: Foda[]; isAdmin: boolean; onChanged: (items: Came[]) => void;
}) {
  const [items, setItems] = useState<Came[]>(initial);
  const [showNuevo, setShowNuevo] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [generarError, setGenerarError] = useState<string | null>(null);
  const [generados, setGenerados] = useState<Generado[] | null>(null);

  function handleSaved(item: Came) {
    const next = [item, ...items];
    setItems(next);
    onChanged(next);
    setShowNuevo(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta estrategia CAME?")) return;
    const res = await fetch(`/api/came?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      const next = items.filter((i) => i.id !== id);
      setItems(next);
      onChanged(next);
    }
  }

  async function handleGenerar() {
    if (foda.length === 0) {
      setGenerarError("Completa la pestaña FODA antes de generar CAME.");
      return;
    }
    setGenerando(true);
    setGenerarError(null);
    const res = await fetch("/api/came/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: foda.map((f) => ({ cuadrante: f.cuadrante, sistema: f.sistema, descripcion: f.descripcion })) }),
    });
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      setGenerados(body.rows ?? []);
    } else {
      const body = await res.json().catch(() => ({}));
      setGenerarError(body.error ?? "No se pudo generar las estrategias CAME.");
    }
    setGenerando(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-zinc-500">Estrategias CAME (Corregir / Afrontar / Mantener / Explotar) — cruce de la matriz FODA, cláusula 6.1.</p>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={handleGenerar} disabled={generando}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
              <span className="text-base leading-none">✦</span> {generando ? "Generando…" : "Generar CAME con IA"}
            </button>
            <button onClick={() => setShowNuevo(true)} className="px-4 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600">
              + Nueva estrategia
            </button>
          </div>
        )}
      </div>
      {generarError && <p className="text-sm text-red-600">{generarError}</p>}

      {items.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">No hay estrategias CAME cargadas todavía.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIPOS.map((tipo) => {
            const info = TIPO_INFO[tipo];
            const delTipo = items.filter((i) => i.tipo === tipo);
            return (
              <div key={tipo} className={`rounded-xl border p-4 ${info.color.split(" ").filter((c) => c.startsWith("border") || c.startsWith("bg")).join(" ")}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold">{tipo} — {info.label}</p>
                  <span className="text-xs opacity-70">{info.desc}</span>
                </div>
                {delTipo.length === 0 ? (
                  <p className="text-xs opacity-60">Sin estrategias.</p>
                ) : (
                  <div className="space-y-2">
                    {delTipo.map((item) => (
                      <div key={item.id} className="bg-white/70 rounded-lg px-3 py-2.5 border border-white">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">{item.sistema}</span>
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${PRIORIDAD_COLOR[item.prioridad] ?? "bg-zinc-100"}`}>{item.prioridad}</span>
                            </div>
                            <p className="text-sm font-medium text-zinc-800">{item.titulo}</p>
                            <p className="text-xs text-zinc-600 mt-0.5">{item.descripcion}</p>
                            {item.itemsFoda && <p className="text-xs text-zinc-400 mt-1">↳ {item.itemsFoda}</p>}
                            {item.responsable && <p className="text-xs text-zinc-400 mt-0.5">Responsable: {item.responsable}</p>}
                          </div>
                          {isAdmin && (
                            <button onClick={() => handleDelete(item.id)} className="text-zinc-300 hover:text-red-500 text-lg leading-none shrink-0">×</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
