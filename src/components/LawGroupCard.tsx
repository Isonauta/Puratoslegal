"use client";

import { useState } from "react";
import { RequirementRow } from "./RequirementRow";

type Requirement = Parameters<typeof RequirementRow>[0]["requirement"];

type Props = {
  tipoDocumento: string;
  documentoNumero: string | null;
  organismo: string;
  requirements: Requirement[];
  coveredLeyKeys: Set<string>;
};

export function LawGroupCard({ tipoDocumento, documentoNumero, organismo, requirements, coveredLeyKeys }: Props) {
  const [open, setOpen] = useState(false);

  const cumpleCount    = requirements.filter(r => r.cumple === "SI").length;
  const noCumpleCount  = requirements.filter(r => r.cumple === "NO").length;
  const pendienteCount = requirements.filter(r => r.cumple === "PENDIENTE").length;
  const noAplicaCount  = requirements.filter(r => r.cumple === "NO_APLICA").length;

  const lawLabel = documentoNumero ? `${tipoDocumento} N°${documentoNumero}` : tipoDocumento;
  const leyKey   = `${tipoDocumento}|${documentoNumero ?? ""}`;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors rounded-lg"
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{lawLabel}</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {organismo} · {requirements.length} artículo{requirements.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {cumpleCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
              ✓ {cumpleCount}
            </span>
          )}
          {noCumpleCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
              ✗ {noCumpleCount}
            </span>
          )}
          {pendienteCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              ⏳ {pendienteCount}
            </span>
          )}
          {noAplicaCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              — {noAplicaCount}
            </span>
          )}
          <span className="ml-1 text-zinc-400">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
          {requirements.map(r => (
            <RequirementRow
              key={r.id}
              requirement={r}
              hasActionPlan={coveredLeyKeys.has(leyKey)}
              grouped
            />
          ))}
        </div>
      )}
    </div>
  );
}
