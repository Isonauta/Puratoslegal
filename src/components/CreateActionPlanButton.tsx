"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RESPONSABLES } from "./RequirementRow";

export type Req = {
  id: string;
  numero: number;
  titulo: string;
  ambito: string;
  responsable: string | null;
  cumple: string;
  tipoDocumento: string;
  documentoNumero: string | null;
  articulo: string | null;
  requisitoTexto: string | null;
};

type AccionRow = {
  accion: string;
  responsable: string;
  fecha: string;
};

function leyLabel(req: Req) {
  return req.documentoNumero
    ? `${req.tipoDocumento} N°${req.documentoNumero}`
    : req.tipoDocumento;
}

function emptyRow(defaultResponsable: string): AccionRow {
  return { accion: "", responsable: defaultResponsable, fecha: "" };
}

export function CreateActionPlanButton({ reqs }: { reqs: Req[] }) {
  const router = useRouter();
  const first = reqs[0];
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AccionRow[]>([emptyRow(first.responsable ?? "")]);
  const [saving, setSaving] = useState(false);

  function updateRow(i: number, field: keyof AccionRow, value: string) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(first.responsable ?? "")]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    const valid = rows.filter((r) => r.accion.trim());
    if (!valid.length) return;
    setSaving(true);
    await Promise.all(
      valid.map((r) =>
        fetch("/api/action-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            legalRequirementId: first.id,
            titulo: leyLabel(first),
            accionCorrectiva: r.accion.trim(),
            responsable: r.responsable || null,
            fechaEjecucion: r.fecha || null,
          }),
        })
      )
    );
    setSaving(false);
    setOpen(false);
    setRows([emptyRow(first.responsable ?? "")]);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded border border-blue-300 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
      >
        + Crear plan
      </button>
    );
  }

  const canSave = rows.some((r) => r.accion.trim());

  return (
    <div className="mt-3 space-y-3 rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
      <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
        Plan de acción — {leyLabel(first)}
      </p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Agrega una o más acciones. Cada una puede tener su propio responsable y plazo.
      </p>

      {rows.map((row, i) => (
        <div key={i} className="rounded border border-blue-100 bg-white p-3 dark:border-blue-900 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Acción {i + 1}</span>
            {rows.length > 1 && (
              <button onClick={() => removeRow(i)} className="text-xs text-zinc-400 hover:text-red-500">✕ Quitar</button>
            )}
          </div>
          <textarea
            autoFocus={i === 0}
            rows={2}
            placeholder="Acción correctiva a tomar…"
            value={row.accion}
            onChange={(e) => updateRow(i, "accion", e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <select
              value={row.responsable}
              onChange={(e) => updateRow(i, "responsable", e.target.value)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Sin asignar</option>
              {RESPONSABLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input
              type="date"
              value={row.fecha}
              onChange={(e) => updateRow(i, "fecha", e.target.value)}
              className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="w-full rounded border border-dashed border-blue-300 py-1.5 text-xs text-blue-500 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/30"
      >
        + Agregar otra acción
      </button>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={saving || !canSave}
          onClick={save}
          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {saving ? "Guardando…" : `Guardar ${rows.filter((r) => r.accion.trim()).length > 1 ? `${rows.filter((r) => r.accion.trim()).length} acciones` : "plan"}`}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setRows([emptyRow(first.responsable ?? "")]); }}
          className="text-xs text-zinc-500 hover:text-zinc-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
