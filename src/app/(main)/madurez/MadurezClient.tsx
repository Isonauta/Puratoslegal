"use client";

import { useState } from "react";
import type { Item, Respuesta } from "@/lib/madurez";
import CuestionarioMadurez from "./CuestionarioMadurez";
import DashboardMadurez from "./DashboardMadurez";

type Evaluacion = { id: string; tipo: "AS_IS" | "TO_BE"; fecha: string; planta: string | null; evaluador: string | null; comentario: string | null };

const TABS = ["Dashboard", "Cuestionario As Is", "Cuestionario To Be"] as const;

export default function MadurezClient({
  items, evaluaciones: evaluacionesInicial, initialAsIsId, initialToBeId,
  initialAsIsRespuestas, initialToBeRespuestas, isAdmin, userName,
}: {
  items: Item[]; evaluaciones: Evaluacion[]; initialAsIsId: string | null; initialToBeId: string | null;
  initialAsIsRespuestas: Respuesta[]; initialToBeRespuestas: Respuesta[]; isAdmin: boolean; userName: string | null;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Dashboard");
  const [evaluaciones, setEvaluaciones] = useState(evaluacionesInicial);
  const [asIsId, setAsIsId] = useState(initialAsIsId);
  const [toBeId, setToBeId] = useState(initialToBeId);
  const [asIsRespuestas, setAsIsRespuestas] = useState(initialAsIsRespuestas);
  const [toBeRespuestas, setToBeRespuestas] = useState(initialToBeRespuestas);
  const [creando, setCreando] = useState<"AS_IS" | "TO_BE" | null>(null);

  const asIsHistorial = evaluaciones.filter((e) => e.tipo === "AS_IS");
  const toBeHistorial = evaluaciones.filter((e) => e.tipo === "TO_BE");

  async function crearEvaluacion(tipo: "AS_IS" | "TO_BE") {
    if (!isAdmin) return;
    setCreando(tipo);
    try {
      const clonarDesdeId = tipo === "AS_IS" ? asIsId : toBeId;
      const res = await fetch("/api/madurez/evaluaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, clonarDesdeId, evaluador: userName }),
      });
      if (!res.ok) return;
      const nueva: Evaluacion = await res.json();
      setEvaluaciones((prev) => [nueva, ...prev]);
      const detalle = await fetch(`/api/madurez/evaluaciones/${nueva.id}`).then((r) => r.json());
      if (tipo === "AS_IS") {
        setAsIsId(nueva.id);
        setAsIsRespuestas(detalle.respuestas);
      } else {
        setToBeId(nueva.id);
        setToBeRespuestas(detalle.respuestas);
      }
    } finally {
      setCreando(null);
    }
  }

  async function seleccionarEvaluacion(tipo: "AS_IS" | "TO_BE", id: string) {
    const detalle = await fetch(`/api/madurez/evaluaciones/${id}`).then((r) => r.json());
    if (tipo === "AS_IS") {
      setAsIsId(id);
      setAsIsRespuestas(detalle.respuestas);
    } else {
      setToBeId(id);
      setToBeRespuestas(detalle.respuestas);
    }
  }

  function onRespuestaChanged(tipo: "AS_IS" | "TO_BE", r: Respuesta) {
    const setter = tipo === "AS_IS" ? setAsIsRespuestas : setToBeRespuestas;
    setter((prev) => {
      const idx = prev.findIndex((p) => p.criterioId === r.criterioId);
      if (idx === -1) return [...prev, r];
      const copy = [...prev];
      copy[idx] = r;
      return copy;
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Madurez OpX — Health and Safety</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Pirámide de madurez del framework Puratos: 24 ítems en 4 niveles, evaluados As Is vs To Be, con historial de evolución.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <EvaluacionSelector
          label="Evaluación As Is"
          evaluaciones={asIsHistorial}
          selectedId={asIsId}
          onSelect={(id) => seleccionarEvaluacion("AS_IS", id)}
          onCrear={() => crearEvaluacion("AS_IS")}
          creando={creando === "AS_IS"}
          isAdmin={isAdmin}
        />
        <EvaluacionSelector
          label="Evaluación To Be (meta)"
          evaluaciones={toBeHistorial}
          selectedId={toBeId}
          onSelect={(id) => seleccionarEvaluacion("TO_BE", id)}
          onCrear={() => crearEvaluacion("TO_BE")}
          creando={creando === "TO_BE"}
          isAdmin={isAdmin}
        />
      </div>

      <div className="flex gap-1 border-b border-zinc-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t ? "border-[#C41230] text-[#C41230]" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Dashboard" && (
        <DashboardMadurez items={items} asIsRespuestas={asIsRespuestas} toBeRespuestas={toBeRespuestas} />
      )}

      {tab === "Cuestionario As Is" && (
        <CuestionarioMadurez
          items={items}
          evaluacionId={asIsId}
          respuestas={asIsRespuestas}
          isAdmin={isAdmin}
          onRespuestaChanged={(r) => onRespuestaChanged("AS_IS", r)}
        />
      )}

      {tab === "Cuestionario To Be" && (
        <CuestionarioMadurez
          items={items}
          evaluacionId={toBeId}
          respuestas={toBeRespuestas}
          isAdmin={isAdmin}
          onRespuestaChanged={(r) => onRespuestaChanged("TO_BE", r)}
        />
      )}
    </div>
  );
}

function EvaluacionSelector({ label, evaluaciones, selectedId, onSelect, onCrear, creando, isAdmin }: {
  label: string; evaluaciones: Evaluacion[]; selectedId: string | null; onSelect: (id: string) => void;
  onCrear: () => void; creando: boolean; isAdmin: boolean;
}) {
  return (
    <div className="bg-white border border-zinc-100 rounded-lg px-3 py-2 flex items-center gap-2 flex-1 min-w-[260px]">
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-widest text-zinc-400">{label}</p>
        {evaluaciones.length === 0 ? (
          <p className="text-xs text-zinc-400">Sin evaluaciones todavía</p>
        ) : (
          <select
            value={selectedId ?? ""}
            onChange={(e) => onSelect(e.target.value)}
            className="text-sm font-medium text-zinc-700 bg-transparent outline-none w-full"
          >
            {evaluaciones.map((e) => (
              <option key={e.id} value={e.id}>
                {new Date(e.fecha).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
                {e.planta ? ` · ${e.planta}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>
      {isAdmin && (
        <button
          onClick={onCrear}
          disabled={creando}
          className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 whitespace-nowrap"
        >
          {creando ? "Creando…" : "+ Nueva"}
        </button>
      )}
    </div>
  );
}
