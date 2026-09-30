"use client";

import { useState } from "react";

export interface Determinacion {
  id: string;
  fecha: string;
  esPertinente: boolean;
  justificacion: string;
  expectativasPartesInteresadas: string | null;
  riesgosFisicos: string | null;
  riesgosTransicion: string | null;
  oportunidadesClimaticas: string | null;
  responsable: string | null;
  createdAt: string;
}

const PASOS = ["1. Determinación Cláusulas 4.1 y 4.2", "2. Riesgos Físicos, de Transición y Oportunidades", "3. Dictamen y Declaración Formal"];

function NuevaDeterminacionModal({ onClose, onSaved }: { onClose: () => void; onSaved: (d: Determinacion) => void }) {
  const [paso, setPaso] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    esPertinente: "true",
    justificacion: "",
    expectativasPartesInteresadas: "",
    riesgosFisicos: "",
    riesgosTransicion: "",
    oportunidadesClimaticas: "",
    responsable: "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    setSaving(true);
    const res = await fetch("/api/determinacion-climatica", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, esPertinente: form.esPertinente === "true" }),
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
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Evaluación de Adenda de Cambio Climático</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Resolución conjunta ISO/IAF 2024 — Cláusulas 4.1 y 4.2</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>

        <div className="flex gap-1 px-6 pt-4 border-b border-zinc-100">
          {PASOS.map((p, i) => (
            <button key={p} onClick={() => setPaso(i)}
              className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap ${paso === i ? "border-[#C41230] text-[#C41230]" : "border-transparent text-zinc-400"}`}>
              {p}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">
          {paso === 0 && (
            <>
              <div>
                <label className={lbl}>¿Ha determinado la organización si el cambio climático es una cuestión pertinente? *</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => set("esPertinente", "true")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.esPertinente === "true" ? "bg-[#C41230] text-white border-[#C41230]" : "border-zinc-200 text-zinc-600"}`}>
                    Sí es pertinente
                  </button>
                  <button type="button" onClick={() => set("esPertinente", "false")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${form.esPertinente === "false" ? "bg-[#C41230] text-white border-[#C41230]" : "border-zinc-200 text-zinc-600"}`}>
                    No es pertinente
                  </button>
                </div>
              </div>
              <div>
                <label className={lbl}>Justificación documentada de la decisión (para el auditor) *</label>
                <textarea className={inp} rows={5} value={form.justificacion} onChange={(e) => set("justificacion", e.target.value)} required />
                <p className="text-[11px] text-zinc-400 mt-1">Si se determina &quot;No pertinente&quot;, debe documentarse una justificación objetiva y libre de sesgo.</p>
              </div>
            </>
          )}

          {paso === 1 && (
            <>
              <div>
                <label className={lbl}>Requisitos y expectativas de partes interesadas relacionados con cambio climático</label>
                <textarea className={inp} rows={3} value={form.expectativasPartesInteresadas} onChange={(e) => set("expectativasPartesInteresadas", e.target.value)}
                  placeholder="ej. Clientes exigen reporte de huella de carbono, autoridades exigen planes de contingencia ante eventos climáticos extremos…" />
              </div>
              <div>
                <label className={lbl}>Riesgos físicos (eventos agudos o crónicos: sequía, calor extremo, inundaciones…)</label>
                <textarea className={inp} rows={2} value={form.riesgosFisicos} onChange={(e) => set("riesgosFisicos", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Riesgos de transición (normativos, de mercado, tecnológicos, reputacionales)</label>
                <textarea className={inp} rows={2} value={form.riesgosTransicion} onChange={(e) => set("riesgosTransicion", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Oportunidades relacionadas con el cambio climático</label>
                <textarea className={inp} rows={2} value={form.oportunidadesClimaticas} onChange={(e) => set("oportunidadesClimaticas", e.target.value)} />
              </div>
            </>
          )}

          {paso === 2 && (
            <>
              <div className="bg-zinc-50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-semibold text-zinc-800">Vista previa de la declaración</p>
                <p><strong>Determinación:</strong> el cambio climático {form.esPertinente === "true" ? "ES" : "NO ES"} una cuestión pertinente para el sistema de gestión.</p>
                <p><strong>Justificación:</strong> {form.justificacion || "—"}</p>
                {form.expectativasPartesInteresadas && <p><strong>Partes interesadas:</strong> {form.expectativasPartesInteresadas}</p>}
                {form.riesgosFisicos && <p><strong>Riesgos físicos:</strong> {form.riesgosFisicos}</p>}
                {form.riesgosTransicion && <p><strong>Riesgos de transición:</strong> {form.riesgosTransicion}</p>}
                {form.oportunidadesClimaticas && <p><strong>Oportunidades:</strong> {form.oportunidadesClimaticas}</p>}
              </div>
              <div>
                <label className={lbl}>Responsable de la determinación</label>
                <input className={inp} value={form.responsable} onChange={(e) => set("responsable", e.target.value)} />
              </div>
            </>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancelar</button>
            <div className="flex gap-2">
              {paso > 0 && (
                <button type="button" onClick={() => setPaso((p) => p - 1)} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Atrás</button>
              )}
              {paso < 2 ? (
                <button type="button" onClick={() => setPaso((p) => p + 1)} disabled={paso === 0 && !form.justificacion.trim()}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
                  Siguiente
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
                  {saving ? "Guardando…" : "Guardar determinación"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeclaracionFormal({ d }: { d: Determinacion }) {
  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Declaración Formal para Auditoría</p>
          <h3 className="text-base font-semibold text-zinc-900 mt-0.5">Determinación de Pertinencia — Cambio Climático (ISO/IAF Amd 1:2024)</h3>
        </div>
        <button onClick={() => window.print()} className="print:hidden text-sm border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50 text-zinc-600">
          Imprimir
        </button>
      </div>

      <div className={`rounded-lg px-4 py-3 border ${d.esPertinente ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-zinc-50 border-zinc-200 text-zinc-700"}`}>
        <p className="text-sm font-semibold">
          Cláusulas 4.1 y 4.2 — Dictamen: el cambio climático {d.esPertinente ? "ES" : "NO ES"} una cuestión pertinente para el Sistema Integrado de Gestión.
        </p>
        <p className="text-xs mt-1 opacity-80">Determinado el {new Date(d.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}{d.responsable ? ` por ${d.responsable}` : ""}.</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Justificación documentada</p>
        <p className="text-sm text-zinc-700 mt-1">{d.justificacion}</p>
      </div>

      {d.expectativasPartesInteresadas && (
        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Requisitos y expectativas de partes interesadas (cláusula 4.2)</p>
          <p className="text-sm text-zinc-700 mt-1">{d.expectativasPartesInteresadas}</p>
        </div>
      )}

      {(d.riesgosFisicos || d.riesgosTransicion || d.oportunidadesClimaticas) && (
        <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-50">
          {d.riesgosFisicos && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Riesgos físicos</p>
              <p className="text-xs text-zinc-600 mt-1">{d.riesgosFisicos}</p>
            </div>
          )}
          {d.riesgosTransicion && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Riesgos de transición</p>
              <p className="text-xs text-zinc-600 mt-1">{d.riesgosTransicion}</p>
            </div>
          )}
          {d.oportunidadesClimaticas && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Oportunidades</p>
              <p className="text-xs text-zinc-600 mt-1">{d.oportunidadesClimaticas}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CambioClimaticoTab({ items: initial, isAdmin, onChanged }: {
  items: Determinacion[]; isAdmin: boolean; onChanged: (items: Determinacion[]) => void;
}) {
  const [items, setItems] = useState<Determinacion[]>(initial);
  const [showNueva, setShowNueva] = useState(false);

  const vigente = items[0] ?? null;
  const historial = items.slice(1);

  function handleSaved(item: Determinacion) {
    const next = [item, ...items];
    setItems(next);
    onChanged(next);
    setShowNueva(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta determinación?")) return;
    const res = await fetch(`/api/determinacion-climatica?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      const next = items.filter((i) => i.id !== id);
      setItems(next);
      onChanged(next);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm text-zinc-500">Determinación de pertinencia del cambio climático (Resolución conjunta ISO/IAF 2024, cláusulas 4.1 y 4.2) — aplica a ISO 14001 e ISO 45001.</p>
        {isAdmin && (
          <button onClick={() => setShowNueva(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] shrink-0">
            <span className="text-base leading-none">✦</span> Nueva determinación
          </button>
        )}
      </div>

      {vigente ? (
        <DeclaracionFormal d={vigente} />
      ) : (
        <div className="text-center py-16 text-zinc-400 text-sm">Todavía no hay una determinación de cambio climático registrada.</div>
      )}

      {historial.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Determinaciones anteriores</p>
          {historial.map((d) => (
            <div key={d.id} className="flex items-center justify-between bg-white border border-zinc-100 rounded-xl px-4 py-2.5">
              <span className="text-xs text-zinc-500">
                {new Date(d.fecha).toLocaleDateString("es-CL")} — {d.esPertinente ? "Pertinente" : "No pertinente"}
              </span>
              {isAdmin && (
                <button onClick={() => handleDelete(d.id)} className="text-zinc-300 hover:text-red-500 text-lg leading-none">×</button>
              )}
            </div>
          ))}
        </div>
      )}

      {showNueva && <NuevaDeterminacionModal onClose={() => setShowNueva(false)} onSaved={handleSaved} />}
    </div>
  );
}
