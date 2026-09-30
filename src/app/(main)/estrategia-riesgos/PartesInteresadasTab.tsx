"use client";

import { useState } from "react";

export interface ParteInteresada {
  id: string;
  nombre: string;
  poder: string;
  impacto: string;
  necesidades: string | null;
  expectativas: string | null;
  estrategias: string | null;
  mecanismoSeguimiento: string | null;
  responsable: string | null;
}

const ESTRATEGIA: Record<string, { label: string; color: string; dot: string }> = {
  "Alto-Alto": { label: "Colaborar con / Solicitar directrices", color: "text-emerald-700 bg-emerald-50", dot: "bg-emerald-500" },
  "Bajo-Alto": { label: "Involucrar, crear capacidad y garantizar intereses", color: "text-orange-700 bg-orange-50", dot: "bg-orange-400" },
  "Alto-Bajo": { label: "Mitigar impactos, defenderse de", color: "text-red-700 bg-red-50", dot: "bg-red-500" },
  "Bajo-Bajo": { label: "Monitorear", color: "text-zinc-500 bg-zinc-100", dot: "bg-zinc-400" },
};

function estrategiaDe(poder: string, impacto: string) {
  return ESTRATEGIA[`${poder}-${impacto}`] ?? ESTRATEGIA["Bajo-Bajo"];
}

const CUADRANTES: { poder: string; impacto: string; bg: string; border: string; badge?: string }[] = [
  { poder: "Alto", impacto: "Bajo", bg: "bg-red-50/60", border: "border-red-100" },
  { poder: "Alto", impacto: "Alto", bg: "bg-emerald-50/60", border: "border-emerald-200", badge: "PRIORIDAD ALTA" },
  { poder: "Bajo", impacto: "Bajo", bg: "bg-zinc-50", border: "border-zinc-100" },
  { poder: "Bajo", impacto: "Alto", bg: "bg-orange-50/60", border: "border-orange-100" },
];

function MatrizVisual({ items, onSelect }: { items: ParteInteresada[]; onSelect: (p: ParteInteresada) => void }) {
  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-4">
      <p className="text-sm font-semibold text-zinc-800 mb-0.5">Matriz de Partes Interesadas</p>
      <p className="text-xs text-zinc-500 mb-4">Priorización según poder e impacto en el Sistema de Gestión Integrado</p>
      <div className="flex gap-2">
        <div className="flex items-center shrink-0">
          <span className="text-[10px] font-semibold text-zinc-400 tracking-wide" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            ↑ PODER
          </span>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 grid-rows-2 gap-1.5 aspect-[4/3] sm:aspect-[16/9]">
            {CUADRANTES.map((q) => {
              const est = estrategiaDe(q.poder, q.impacto);
              const enCuadrante = items.filter((i) => i.poder === q.poder && i.impacto === q.impacto);
              return (
                <div key={`${q.poder}-${q.impacto}`} className={`relative rounded-lg border ${q.bg} ${q.border} p-2.5 overflow-hidden`}>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide leading-tight">{est.label}</span>
                    {q.badge && <span className="shrink-0 text-[9px] font-bold text-white bg-[#C41230] px-1.5 py-0.5 rounded">{q.badge}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {enCuadrante.map((item) => (
                      <button key={item.id} onClick={() => onSelect(item)}
                        className="flex flex-col items-center gap-0.5 group" title={item.nombre}>
                        <span className={`w-6 h-6 rounded-full border-2 ${est.dot} border-white shadow-sm group-hover:scale-110 transition-transform`} />
                        <span className="text-[10px] text-zinc-600 font-medium text-center leading-tight max-w-[70px] truncate group-hover:text-[#C41230]">{item.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center mt-1.5">
            <span className="text-[10px] font-semibold text-zinc-400 tracking-wide">IMPACTO →</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ item, onClose, onSaved }: { item: ParteInteresada | null; onClose: () => void; onSaved: (p: ParteInteresada) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: item?.nombre ?? "", poder: item?.poder ?? "Alto", impacto: item?.impacto ?? "Alto",
    necesidades: item?.necesidades ?? "", expectativas: item?.expectativas ?? "", estrategias: item?.estrategias ?? "",
    mecanismoSeguimiento: item?.mecanismoSeguimiento ?? "", responsable: item?.responsable ?? "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/partes-interesadas", {
      method: item ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item ? { ...form, id: item.id } : form),
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
          <h2 className="text-base font-semibold text-zinc-900">{item ? "Editar parte interesada" : "Nueva parte interesada"}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={lbl}>Nombre *</label>
            <input className={inp} placeholder="ej. Proveedores, Comunidad, Clientes" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Poder *</label>
              <select className={inp} value={form.poder} onChange={(e) => set("poder", e.target.value)}>
                <option>Alto</option><option>Bajo</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Impacto *</label>
              <select className={inp} value={form.impacto} onChange={(e) => set("impacto", e.target.value)}>
                <option>Alto</option><option>Bajo</option>
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Necesidades</label>
            <textarea className={inp} rows={2} value={form.necesidades} onChange={(e) => set("necesidades", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Expectativas</label>
            <textarea className={inp} rows={2} value={form.expectativas} onChange={(e) => set("expectativas", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Estrategias</label>
            <textarea className={inp} rows={2} value={form.estrategias} onChange={(e) => set("estrategias", e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Mecanismo de seguimiento</label>
            <textarea className={inp} rows={2} value={form.mecanismoSeguimiento} onChange={(e) => set("mecanismoSeguimiento", e.target.value)} />
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

export default function PartesInteresadasTab({ items: initial, isAdmin, onChanged }: {
  items: ParteInteresada[]; isAdmin: boolean; onChanged: (items: ParteInteresada[]) => void;
}) {
  const [items, setItems] = useState<ParteInteresada[]>(initial);
  const [editing, setEditing] = useState<ParteInteresada | null | "new">(null);

  function handleSaved(item: ParteInteresada) {
    const next = editing === "new" ? [...items, item] : items.map((i) => (i.id === item.id ? item : i));
    setItems(next);
    onChanged(next);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta parte interesada?")) return;
    const res = await fetch(`/api/partes-interesadas?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      const next = items.filter((i) => i.id !== id);
      setItems(next);
      onChanged(next);
    }
  }

  return (
    <div className="space-y-4">
      <MatrizVisual items={items} onSelect={setEditing} />
      <p className="text-xs text-zinc-400 px-1">Poder: capacidad de influenciar las políticas y decisiones de la dirección. Impacto: qué tan afectada puede verse (o afectar) la parte interesada por la gestión de calidad, medio ambiente y SST. Haz clic en una burbuja para ver el detalle.</p>

      {isAdmin && (
        <div className="flex justify-end">
          <button onClick={() => setEditing("new")} className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26]">
            + Nueva parte interesada
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">No hay partes interesadas cargadas.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const est = estrategiaDe(item.poder, item.impacto);
            return (
              <div key={item.id} className="bg-white border border-zinc-100 rounded-xl px-5 py-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <p className="text-sm font-medium text-zinc-800">{item.nombre}</p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>Poder: <strong>{item.poder}</strong></span>
                    <span>Impacto: <strong>{item.impacto}</strong></span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${est.color}`}>{est.label}</span>
                    {isAdmin && (
                      <>
                        <button onClick={() => setEditing(item)} className="px-3 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50">Ver / Editar</button>
                        <button onClick={() => handleDelete(item.id)} className="text-zinc-300 hover:text-red-500 text-lg leading-none">×</button>
                      </>
                    )}
                  </div>
                </div>
                {(item.necesidades || item.expectativas || item.estrategias || item.mecanismoSeguimiento) && (
                  <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-50">
                    {item.necesidades && (
                      <div>
                        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Necesidades</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{item.necesidades}</p>
                      </div>
                    )}
                    {item.expectativas && (
                      <div>
                        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Expectativas</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{item.expectativas}</p>
                      </div>
                    )}
                    {item.estrategias && (
                      <div>
                        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Estrategias</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{item.estrategias}</p>
                      </div>
                    )}
                    {item.mecanismoSeguimiento && (
                      <div>
                        <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Mecanismo de seguimiento</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{item.mecanismoSeguimiento}</p>
                      </div>
                    )}
                  </div>
                )}
                {item.responsable && (
                  <p className="text-[11px] text-zinc-400 mt-2">Responsable: {item.responsable}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && <EditModal item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </div>
  );
}
