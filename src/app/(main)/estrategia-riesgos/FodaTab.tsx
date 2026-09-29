"use client";

import { useState } from "react";
import type { Pestel } from "./PestelTab";

const SISTEMAS = ["SST", "MA"];
const AMBITOS = ["EXTERNAS", "INTERNAS"];
const CUADRANTES = ["Fortaleza", "Oportunidad", "Debilidad", "Amenaza"];
const TRATAMIENTOS_RIESGO = ["Mitigar", "Aceptar", "Transferir", "Eliminar"];
const TRATAMIENTOS_OPP = ["Aprovechar", "Aceptar", "Mitigar"];
const SCALE = [1, 2, 3, 4, 5];

const CUADRANTE_COLOR: Record<string, string> = {
  Fortaleza: "bg-blue-100 text-blue-700 border-blue-200",
  Oportunidad: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Debilidad: "bg-orange-100 text-orange-700 border-orange-200",
  Amenaza: "bg-red-100 text-red-700 border-red-200",
};

function clasificar(p: number, i: number): string {
  const n = p * i;
  if (n >= 20) return "Crítico";
  if (n >= 12) return "Alto";
  if (n >= 6) return "Medio";
  return "Bajo";
}

export interface Foda {
  id: string;
  sistema: string;
  ambito: string;
  cuestion: string;
  cuadrante: string;
  descripcion: string;
  tipoImpacto: string | null;
  origenPestelId: string | null;
  origenPestel: Pestel | null;
  createdAt: string;
}

function NuevoModal({ pestel, onClose, onSaved }: { pestel: Pestel[]; onClose: () => void; onSaved: (item: Foda) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    sistema: "SST", ambito: "EXTERNAS", cuestion: "", cuadrante: "Oportunidad",
    descripcion: "", tipoImpacto: "", origenPestelId: "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const pestelOpciones = pestel.filter((p) => p.sistema === form.sistema);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/foda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, origenPestelId: form.origenPestelId || null }),
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
          <h2 className="text-base font-semibold text-zinc-900">Nuevo ítem FODA</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="flex gap-2">
            {CUADRANTES.map((c) => (
              <button key={c} type="button" onClick={() => set("cuadrante", c)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.cuadrante === c ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Sistema *</label>
              <select className={inp} value={form.sistema} onChange={(e) => set("sistema", e.target.value)}>
                {SISTEMAS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Ámbito *</label>
              <select className={inp} value={form.ambito} onChange={(e) => set("ambito", e.target.value)}>
                {AMBITOS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={lbl}>Cuestión *</label>
            <input className={inp} placeholder="ej. Económico, Talento Humano, Proveedores" value={form.cuestion} onChange={(e) => set("cuestion", e.target.value)} required />
          </div>
          <div>
            <label className={lbl}>Descripción *</label>
            <textarea className={inp} rows={3} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} required />
          </div>
          <div>
            <label className={lbl}>Tipo de impacto</label>
            <input className={inp} placeholder="ej. Financiero, Operacional" value={form.tipoImpacto} onChange={(e) => set("tipoImpacto", e.target.value)} />
          </div>
          {form.ambito === "EXTERNAS" && (
            <div>
              <label className={lbl}>Vincular a factor PESTEL (opcional)</label>
              <select className={inp} value={form.origenPestelId} onChange={(e) => set("origenPestelId", e.target.value)}>
                <option value="">— Sin vincular —</option>
                {pestelOpciones.map((p) => (
                  <option key={p.id} value={p.id}>{p.categoria}{p.subFactor ? ` · ${p.subFactor}` : ""} — {p.texto.slice(0, 60)}</option>
                ))}
              </select>
            </div>
          )}
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

function PromoverModal({ item, onClose, onPromoted }: { item: Foda; onClose: () => void; onPromoted: () => void }) {
  const [saving, setSaving] = useState(false);
  const tipoSugerido = item.cuadrante === "Amenaza" ? "Riesgo" : item.cuadrante === "Oportunidad" ? "Oportunidad" : item.cuadrante === "Debilidad" ? "Riesgo" : "Oportunidad";
  const [form, setForm] = useState({
    tipo: tipoSugerido, programa: item.sistema, proceso: item.cuestion,
    probabilidad: "3", impacto: "3", tratamiento: tipoSugerido === "Riesgo" ? "Mitigar" : "Aprovechar",
    accionControl: "", responsable: "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const previewClasif = clasificar(parseInt(form.probabilidad), parseInt(form.impacto));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/estrategia-riesgos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        descripcion: item.descripcion,
        causas: null,
        consecuencias: null,
        origenFodaId: item.id,
      }),
    });
    if (res.ok) onPromoted();
    setSaving(false);
  }

  const inp = "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none";
  const lbl = "block text-xs font-medium text-zinc-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">Promover a Riesgo / Oportunidad</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="bg-zinc-50 rounded-lg px-3 py-2 text-sm text-zinc-600">{item.descripcion}</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tipo</label>
              <select className={inp} value={form.tipo} onChange={(e) => { set("tipo", e.target.value); set("tratamiento", e.target.value === "Riesgo" ? "Mitigar" : "Aprovechar"); }}>
                <option>Riesgo</option>
                <option>Oportunidad</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Proceso / Área *</label>
              <input className={inp} value={form.proceso} onChange={(e) => set("proceso", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className={lbl}>Probabilidad (1-5) *</label>
              <div className="flex gap-1">
                {SCALE.map((n) => (
                  <button key={n} type="button" onClick={() => set("probabilidad", String(n))}
                    className={`flex-1 py-1.5 rounded text-sm font-semibold border transition-colors ${form.probabilidad === String(n) ? "bg-[#C41230] text-white border-[#C41230]" : "border-zinc-200 text-zinc-600"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl}>Impacto (1-5) *</label>
              <div className="flex gap-1">
                {SCALE.map((n) => (
                  <button key={n} type="button" onClick={() => set("impacto", String(n))}
                    className={`flex-1 py-1.5 rounded text-sm font-semibold border transition-colors ${form.impacto === String(n) ? "bg-[#C41230] text-white border-[#C41230]" : "border-zinc-200 text-zinc-600"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl}>Nivel</label>
              <div className="rounded-lg px-3 py-2 text-sm font-bold border text-center bg-zinc-50">
                {parseInt(form.probabilidad) * parseInt(form.impacto)} — {previewClasif}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Tratamiento</label>
              <select className={inp} value={form.tratamiento} onChange={(e) => set("tratamiento", e.target.value)}>
                {(form.tipo === "Riesgo" ? TRATAMIENTOS_RIESGO : TRATAMIENTOS_OPP).map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Responsable</label>
              <input className={inp} value={form.responsable} onChange={(e) => set("responsable", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={lbl}>Acción de control</label>
            <textarea className={inp} rows={2} value={form.accionControl} onChange={(e) => set("accionControl", e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
              {saving ? "Guardando…" : "Promover"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FodaTab({ items: initial, pestel, isAdmin, onChanged, onRiesgoCreado }: {
  items: Foda[]; pestel: Pestel[]; isAdmin: boolean; onChanged: (items: Foda[]) => void; onRiesgoCreado: () => void;
}) {
  const [items, setItems] = useState<Foda[]>(initial);
  const [showNuevo, setShowNuevo] = useState(false);
  const [promoviendo, setPromoviendo] = useState<Foda | null>(null);
  const [filSistema, setFilSistema] = useState("Todos");
  const [filAmbito, setFilAmbito] = useState("Todos");
  const [filCuadrante, setFilCuadrante] = useState("Todos");

  const filtered = items.filter((i) => {
    if (filSistema !== "Todos" && i.sistema !== filSistema) return false;
    if (filAmbito !== "Todos" && i.ambito !== filAmbito) return false;
    if (filCuadrante !== "Todos" && i.cuadrante !== filCuadrante) return false;
    return true;
  });

  function handleSaved(item: Foda) {
    const next = [item, ...items];
    setItems(next);
    onChanged(next);
    setShowNuevo(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este ítem FODA?")) return;
    const res = await fetch(`/api/foda?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      const next = items.filter((i) => i.id !== id);
      setItems(next);
      onChanged(next);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-zinc-500">Fortalezas, Oportunidades, Debilidades y Amenazas por cuestión — promovibles a la Matriz de Riesgos y Oportunidades.</p>
        {isAdmin && (
          <button onClick={() => setShowNuevo(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26]">
            <span className="text-base leading-none">+</span> Nuevo ítem
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
        {["Todos", ...AMBITOS].map((a) => (
          <button key={a} onClick={() => setFilAmbito(a)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filAmbito === a ? "bg-zinc-600 text-white border-zinc-600" : "bg-white text-zinc-600 border-zinc-200"}`}>
            {a}
          </button>
        ))}
        <span className="text-zinc-200">|</span>
        {["Todos", ...CUADRANTES].map((c) => (
          <button key={c} onClick={() => setFilCuadrante(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filCuadrante === c ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">No hay ítems FODA cargados para este filtro.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-zinc-100 rounded-xl px-5 py-4">
              <div className="flex items-start gap-3 justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CUADRANTE_COLOR[item.cuadrante]}`}>{item.cuadrante}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{item.sistema}</span>
                    <span className="text-xs text-zinc-400">{item.ambito}</span>
                    <span className="text-xs text-zinc-400">· {item.cuestion}</span>
                  </div>
                  <p className="text-sm text-zinc-800">{item.descripcion}</p>
                  {item.origenPestel && (
                    <p className="text-xs text-zinc-400 mt-1">↳ PESTEL: {item.origenPestel.categoria}{item.origenPestel.subFactor ? ` · ${item.origenPestel.subFactor}` : ""}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (item.cuadrante === "Oportunidad" || item.cuadrante === "Amenaza") && (
                    <button onClick={() => setPromoviendo(item)} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#C41230]/30 text-[#C41230] hover:bg-[#C41230]/5">
                      → Agregar a matriz
                    </button>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(item.id)} className="text-zinc-300 hover:text-red-500 text-lg leading-none">×</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNuevo && <NuevoModal pestel={pestel} onClose={() => setShowNuevo(false)} onSaved={handleSaved} />}
      {promoviendo && (
        <PromoverModal
          item={promoviendo}
          onClose={() => setPromoviendo(null)}
          onPromoted={() => { setPromoviendo(null); onRiesgoCreado(); }}
        />
      )}
    </div>
  );
}
