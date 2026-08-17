"use client";

import { useState } from "react";
import { CreateActionPlanButton, type Req } from "./CreateActionPlanButton";

function leyLabel(r: Req) {
  return r.documentoNumero
    ? `${r.tipoDocumento} N°${r.documentoNumero}`
    : r.tipoDocumento;
}

export function LeyCard({ reqs, color }: { reqs: Req[]; color: "red" | "orange" }) {
  const first = reqs[0];
  const [expanded, setExpanded] = useState(false);

  const borderColor = color === "red"
    ? "border-red-200 border-l-red-400 dark:border-red-900/50"
    : "border-orange-200 border-l-orange-400 dark:border-orange-900/50";

  const label = leyLabel(first);
  const ambitos = [...new Set(reqs.map((r) => r.ambito))].join(", ");
  const responsables = [...new Set(reqs.map((r) => r.responsable).filter(Boolean))].join(", ");

  const numeros = reqs.map((r) => r.numero).sort((a, b) => a - b);
  const numerosStr = numeros.length <= 5
    ? numeros.map((n) => `N°${n}`).join(", ")
    : `${numeros.slice(0, 3).map((n) => `N°${n}`).join(", ")} y ${numeros.length - 3} más`;

  return (
    <div className={`rounded-lg border border-l-4 bg-white dark:bg-zinc-900 ${borderColor}`}>
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {ambitos} · {reqs.length} artículo{reqs.length !== 1 ? "s" : ""} afectado{reqs.length !== 1 ? "s" : ""} ({numerosStr})
          </p>
          {responsables && (
            <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Responsable: {responsables}</p>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400"
          >
            {expanded ? "▲ Ocultar requisitos" : "▼ Ver qué hay que cumplir"}
          </button>
        </div>
        <CreateActionPlanButton reqs={reqs} />
      </div>

      {/* Detalle expandible de requisitos */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Artículos afectados
          </p>
          <div className="space-y-3">
            {reqs.sort((a, b) => a.numero - b.numero).map((r) => (
              <div key={r.id} className="rounded border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  N°{r.numero}{r.articulo ? ` — Art. ${r.articulo}` : ""}
                </p>
                {r.requisitoTexto ? (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 line-clamp-3">
                    {r.requisitoTexto}
                  </p>
                ) : (
                  <p className="mt-1 text-xs italic text-zinc-400 dark:text-zinc-500">{r.titulo}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
