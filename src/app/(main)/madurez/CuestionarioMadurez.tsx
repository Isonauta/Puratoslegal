"use client";

import { useMemo, useState } from "react";
import { banda, itemScore, respuestaMapFor, NIVEL_LABELS, type Item, type Respuesta } from "@/lib/madurez";

const VALOR_OPCIONES: { valor: number | null; label: string }[] = [
  { valor: null, label: "N.E." },
  { valor: 0, label: "0" },
  { valor: 0.5, label: "0,5" },
  { valor: 1, label: "1" },
];

export default function CuestionarioMadurez({ items, evaluacionId, respuestas, isAdmin, onRespuestaChanged }: {
  items: Item[]; evaluacionId: string | null; respuestas: Respuesta[]; isAdmin: boolean;
  onRespuestaChanged: (r: Respuesta) => void;
}) {
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [idioma, setIdioma] = useState<"es" | "en">("es");

  const respuestaMap = useMemo(() => respuestaMapFor(respuestas), [respuestas]);

  const itemsFiltrados = useMemo(() => {
    if (!soloPendientes) return items;
    return items.filter((it) => (itemScore(it, respuestaMap) ?? 0) < 100);
  }, [items, respuestaMap, soloPendientes]);

  async function guardarValor(criterioId: string, itemId: string, valor: number | null) {
    if (!evaluacionId || !isAdmin) return;
    setSaving(criterioId);
    try {
      const res = await fetch("/api/madurez/respuestas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluacionId, criterioId, itemId, valor }),
      });
      if (res.ok) {
        const r = await res.json();
        onRespuestaChanged(r);
      }
    } finally {
      setSaving(null);
    }
  }

  if (!evaluacionId) {
    return (
      <p className="text-sm text-zinc-500 bg-zinc-50 rounded-lg px-4 py-3">
        No hay una evaluación creada todavía para este tipo — crea una desde el panel de arriba.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} className="rounded" />
          Mostrar solo pendientes (score &lt; 100%)
        </label>
        <div className="flex gap-1 text-xs">
          <button onClick={() => setIdioma("es")} className={`px-2 py-1 rounded ${idioma === "es" ? "bg-[#C41230] text-white" : "bg-zinc-100 text-zinc-500"}`}>ES</button>
          <button onClick={() => setIdioma("en")} className={`px-2 py-1 rounded ${idioma === "en" ? "bg-[#C41230] text-white" : "bg-zinc-100 text-zinc-500"}`}>EN</button>
        </div>
      </div>

      {[1, 2, 3, 4].map((nivel) => {
        const nivelItems = itemsFiltrados.filter((it) => it.nivel === nivel);
        if (nivelItems.length === 0) return null;
        return (
          <div key={nivel}>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              Nivel {nivel} · {NIVEL_LABELS[nivel]}
            </p>
            <div className="space-y-3">
              {nivelItems.map((item) => {
                const score = itemScore(item, respuestaMap);
                const b = banda(score);
                return (
                  <div key={item.id} className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
                    <div className={`flex items-center justify-between px-4 py-2.5 ${b.bg}`}>
                      <div>
                        <span className="text-xs font-mono text-zinc-400 mr-2">{item.codigo}</span>
                        <span className="text-sm font-semibold text-zinc-800">{item.titulo}</span>
                        <span className="text-xs text-zinc-400 ml-2">{item.workstream}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${b.text}`}>
                        <span className={`w-2 h-2 rounded-full ${b.dot}`} />
                        {score === null ? b.label : `${Math.round(score)}% · ${b.label}`}
                      </span>
                    </div>
                    <div className="divide-y divide-zinc-50">
                      {item.criterios.map((c) => {
                        const r = respuestaMap.get(c.id);
                        return (
                          <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="text-[10px] font-semibold text-zinc-400 w-20 shrink-0">{c.nombrePaso}</span>
                            <p className="text-xs text-zinc-600 flex-1">{idioma === "es" ? c.textoEs : c.textoEn}</p>
                            <div className="flex gap-1 shrink-0">
                              {VALOR_OPCIONES.map((op) => (
                                <button
                                  key={op.label}
                                  disabled={!isAdmin || saving === c.id}
                                  onClick={() => guardarValor(c.id, item.id, op.valor)}
                                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors disabled:opacity-40 ${
                                    r?.valor === op.valor
                                      ? "bg-[#C41230] text-white"
                                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                                  }`}
                                >
                                  {op.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {itemsFiltrados.length === 0 && (
        <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
          Todos los ítems están en 100% — sin pendientes.
        </p>
      )}
    </div>
  );
}
