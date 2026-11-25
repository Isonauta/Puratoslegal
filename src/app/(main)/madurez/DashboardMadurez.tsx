"use client";

import { useEffect, useMemo, useState } from "react";
import {
  banda, itemScore, workstreamScore, overallScore, respuestaMapFor,
  NIVEL_LABELS, type Item, type Respuesta,
} from "@/lib/madurez";

type HistorialPunto = { id: string; tipo: "AS_IS" | "TO_BE"; fecha: string; planta: string | null; evaluador: string | null; scoreGlobal: number | null };

function pct(n: number | null) {
  return n === null ? "—" : `${Math.round(n)}%`;
}

export default function DashboardMadurez({ items, asIsRespuestas, toBeRespuestas }: {
  items: Item[]; asIsRespuestas: Respuesta[]; toBeRespuestas: Respuesta[];
}) {
  const [historial, setHistorial] = useState<HistorialPunto[] | null>(null);

  useEffect(() => {
    fetch("/api/madurez/historial")
      .then((r) => (r.ok ? r.json() : []))
      .then(setHistorial)
      .catch(() => setHistorial([]));
  }, []);

  const asIsMap = useMemo(() => respuestaMapFor(asIsRespuestas), [asIsRespuestas]);
  const toBeMap = useMemo(() => respuestaMapFor(toBeRespuestas), [toBeRespuestas]);

  const overallAsIs = overallScore(items, asIsMap);
  const overallToBe = overallScore(items, toBeMap);
  const workstreams = useMemo(() => Array.from(new Set(items.map((i) => i.workstream))), [items]);

  const asIsSerie = (historial ?? []).filter((h) => h.tipo === "AS_IS");

  return (
    <div className="space-y-8">
      {/* Score global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Madurez actual (As Is)</p>
          <p className="text-3xl font-bold text-zinc-900">{pct(overallAsIs)}</p>
        </div>
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Meta (To Be)</p>
          <p className="text-3xl font-bold text-zinc-900">{pct(overallToBe)}</p>
        </div>
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Brecha</p>
          <p className={`text-3xl font-bold ${overallAsIs !== null && overallToBe !== null && overallToBe - overallAsIs > 0 ? "text-amber-600" : "text-zinc-900"}`}>
            {overallAsIs !== null && overallToBe !== null ? `${Math.round(overallToBe - overallAsIs)} pp` : "—"}
          </p>
        </div>
      </div>

      {/* Pirámide por nivel — un cuadro por ítem, igual que la planilla
          fuente: cada fila de la pirámide es un item por workstream (no un
          solo score agregado), apilados del Nivel 1 (base, más ítems) al
          Nivel 4 (cima). El color de fondo es la banda As Is; el borde es
          la banda To Be, para ver de un vistazo dónde la meta y lo actual
          no coinciden. */}
      <div>
        <p className="text-sm font-semibold text-zinc-800 mb-1">Pirámide de madurez</p>
        <p className="text-xs text-zinc-400 mb-3">Cada casillero es un ítem del nivel — relleno = score As Is, borde = meta To Be.</p>
        <div className="flex flex-col items-center gap-2 py-2">
          {[4, 3, 2, 1].map((nivel) => {
            const nivelItems = items.filter((it) => it.nivel === nivel).sort((a, b) => a.orden - b.orden);
            return (
              <div key={nivel} className="flex items-center gap-3 w-full justify-center">
                <div className="w-24 shrink-0 text-right">
                  <p className="text-xs font-semibold text-zinc-700">Nivel {nivel}</p>
                  <p className="text-[10px] text-zinc-400">{NIVEL_LABELS[nivel]}</p>
                </div>
                <div className="flex gap-1.5">
                  {nivelItems.map((it) => {
                    const asIs = itemScore(it, asIsMap);
                    const toBe = itemScore(it, toBeMap);
                    const bAsIs = banda(asIs);
                    const bToBe = banda(toBe);
                    return (
                      <div
                        key={it.id}
                        title={`${it.codigo} ${it.titulo} — As Is: ${pct(asIs)} (${bAsIs.label}) · To Be: ${pct(toBe)} (${bToBe.label})`}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-md border-2 flex flex-col items-center justify-center cursor-default ${bAsIs.bg} ${bToBe.border}`}
                      >
                        <span className="text-[10px] font-mono text-zinc-500">{it.codigo}</span>
                        <span className={`text-xs font-bold ${bAsIs.text}`}>{asIs === null ? "—" : `${Math.round(asIs)}%`}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Por workstream */}
      <div>
        <p className="text-sm font-semibold text-zinc-800 mb-3">Por workstream</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {workstreams.map((ws) => {
            const asIs = workstreamScore(items, ws, asIsMap);
            const toBe = workstreamScore(items, ws, toBeMap);
            const b = banda(asIs);
            return (
              <div key={ws} className={`rounded-lg border border-zinc-100 px-3 py-2.5 ${b.bg}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-700">{ws}</span>
                  <span className={`text-xs font-bold ${b.text}`}>{pct(asIs)}</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">meta {pct(toBe)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ítems pendientes (punch-list rápida) */}
      <div>
        <p className="text-sm font-semibold text-zinc-800 mb-3">Ítems con mayor brecha (As Is vs To Be)</p>
        <div className="space-y-1.5">
          {items
            .map((it) => ({ it, asIs: itemScore(it, asIsMap), toBe: itemScore(it, toBeMap) }))
            .map((x) => ({ ...x, gap: (x.toBe ?? 0) - (x.asIs ?? 0) }))
            .filter((x) => x.gap > 0)
            .sort((a, b) => b.gap - a.gap)
            .slice(0, 8)
            .map(({ it, asIs, toBe, gap }) => (
              <div key={it.id} className="flex items-center gap-3 text-sm">
                <span className="text-xs font-mono text-zinc-400 w-10 shrink-0">{it.codigo}</span>
                <span className="text-zinc-700 flex-1 truncate">{it.titulo}</span>
                <span className="text-xs text-zinc-400 w-24 text-right">{pct(asIs)} → {pct(toBe)}</span>
                <span className="text-xs font-bold text-amber-600 w-14 text-right">{Math.round(gap)} pp</span>
              </div>
            ))}
          {items.every((it) => (itemScore(it, toBeMap) ?? 0) - (itemScore(it, asIsMap) ?? 0) <= 0) && (
            <p className="text-sm text-zinc-400">Sin brechas registradas todavía (completa la evaluación To Be).</p>
          )}
        </div>
      </div>

      {/* Tendencia en el tiempo */}
      <div>
        <p className="text-sm font-semibold text-zinc-800 mb-3">Evolución de la madurez (As Is)</p>
        {historial === null && <p className="text-sm text-zinc-400">Cargando…</p>}
        {historial !== null && asIsSerie.length < 2 && (
          <p className="text-sm text-zinc-400">
            Necesitas al menos 2 evaluaciones As Is en el tiempo para ver una tendencia — crea una nueva evaluación cuando avances.
          </p>
        )}
        {historial !== null && asIsSerie.length >= 2 && <TrendChart serie={asIsSerie} />}
      </div>
    </div>
  );
}

function TrendChart({ serie }: { serie: HistorialPunto[] }) {
  const W = 600, H = 140, PAD = 24;
  const vals = serie.map((s) => s.scoreGlobal ?? 0);
  const max = Math.max(100, ...vals);
  const points = serie.map((s, i) => {
    const x = PAD + (i / (serie.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((s.scoreGlobal ?? 0) / max) * (H - PAD * 2);
    return { x, y, s };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl h-36">
      <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#e4e4e7" strokeWidth={1} />
      <path d={path} fill="none" stroke="#C41230" strokeWidth={2} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#C41230" />
          <text x={p.x} y={H - 6} fontSize={9} textAnchor="middle" fill="#a1a1aa">
            {new Date(p.s.fecha).toLocaleDateString("es-CL", { month: "short", year: "2-digit" })}
          </text>
          <text x={p.x} y={p.y - 8} fontSize={10} textAnchor="middle" fill="#52525b" fontWeight="bold">
            {Math.round(p.s.scoreGlobal ?? 0)}%
          </text>
        </g>
      ))}
    </svg>
  );
}
