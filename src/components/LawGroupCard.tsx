"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequirementRow } from "./RequirementRow";

type Requirement = Parameters<typeof RequirementRow>[0]["requirement"];

type Props = {
  tipoDocumento: string;
  documentoNumero: string | null;
  organismo: string;
  requirements: Requirement[];
  coveredLeyKeys: Set<string>;
  isAdmin?: boolean;
};

export function LawGroupCard({ tipoDocumento, documentoNumero, organismo, requirements, coveredLeyKeys, isAdmin }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nombreLeyEdit, setNombreLeyEdit] = useState(requirements[0]?.nombreLey ?? "");
  const [savingName, setSavingName] = useState(false);

  const cumpleCount    = requirements.filter(r => r.cumple === "SI").length;
  const noCumpleCount  = requirements.filter(r => r.cumple === "NO").length;
  const pendienteCount = requirements.filter(r => r.cumple === "PENDIENTE").length;
  const noAplicaCount  = requirements.filter(r => r.cumple === "NO_APLICA").length;

  const lawLabel = documentoNumero ? `${tipoDocumento} N°${documentoNumero}` : tipoDocumento;
  const nombreLey = requirements[0]?.nombreLey;

  async function saveLawName() {
    setSavingName(true);
    // Update all requirements under this law with the new name
    await Promise.all(
      requirements.map(r =>
        fetch(`/api/requirements/${r.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombreLey: nombreLeyEdit.trim() || null }),
        })
      )
    );
    setSavingName(false);
    setEditingName(false);
    router.refresh();
  }
  const leyKey   = `${tipoDocumento}|${documentoNumero ?? ""}`;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors rounded-lg"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">{lawLabel}</span>
            {editingName ? (
              <span className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <input
                  autoFocus
                  value={nombreLeyEdit}
                  onChange={e => setNombreLeyEdit(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveLawName(); if (e.key === "Escape") setEditingName(false); }}
                  placeholder="Nombre de la ley o decreto…"
                  className="rounded border border-blue-400 px-2 py-0.5 text-sm text-zinc-700 dark:border-blue-600 dark:bg-zinc-800 dark:text-zinc-100 w-80"
                />
                <button type="button" disabled={savingName} onClick={saveLawName}
                  className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white disabled:opacity-50">
                  {savingName ? "…" : "Guardar"}
                </button>
                <button type="button" onClick={() => setEditingName(false)} className="text-xs text-zinc-400">✕</button>
              </span>
            ) : (
              <>
                {nombreLey
                  ? <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">— {nombreLey}</span>
                  : isAdmin && <span className="text-xs text-zinc-300 dark:text-zinc-600">sin nombre</span>
                }
                {isAdmin && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setEditingName(true); }}
                    className="text-xs text-zinc-400 hover:text-blue-500"
                    title="Editar nombre de la ley"
                  >
                    ✎
                  </button>
                )}
              </>
            )}
          </div>
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
