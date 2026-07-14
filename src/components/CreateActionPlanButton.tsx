"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RESPONSABLES } from "./RequirementRow";

type Req = {
  id: string;
  numero: number;
  titulo: string;
  ambito: string;
  responsable: string | null;
  cumple: string;
};

const MOTIVO: Record<string, string> = {
  NO: "Requisito marcado como No cumple — definir acción correctiva",
  SI: "Cumple declarado pero sin evidencia documental — cargar documento de respaldo",
};

export function CreateActionPlanButton({ req }: { req: Req }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accion, setAccion] = useState("");
  const [responsable, setResponsable] = useState(req.responsable ?? "");
  const [fecha, setFecha] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!accion.trim()) return;
    setSaving(true);
    await fetch("/api/action-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalRequirementId: req.id,
        titulo: `N°${req.numero} · ${req.titulo.slice(0, 80)}`,
        accionCorrectiva: accion.trim(),
        responsable: responsable || null,
        fechaEjecucion: fecha || null,
      }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-blue-300 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
      >
        + Crear plan
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{MOTIVO[req.cumple] ?? ""}</p>
      <textarea
        autoFocus
        rows={2}
        placeholder="Acción correctiva a tomar…"
        value={accion}
        onChange={(e) => setAccion(e.target.value)}
        className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">Sin asignar</option>
          {RESPONSABLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          disabled={saving || !accion.trim()}
          onClick={save}
          className="rounded bg-blue-600 px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar plan"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-zinc-500">
          Cancelar
        </button>
      </div>
    </div>
  );
}
