"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionPlan = {
  id: string;
  noConformidad: number | null;
  titulo: string;
  accionCorrectiva: string;
  responsable: string | null;
  fechaEjecucion: Date | null;
  status: string;
  legalRequirement: { numero: number; ambito: string; titulo: string } | null;
};

const STATUS_OPTIONS = ["ABIERTO", "EN_CURSO", "CERRADO", "VENCIDO"];
const STATUS_LABEL: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_CURSO: "En curso",
  CERRADO: "Cerrado",
  VENCIDO: "Vencido",
};
const STATUS_COLOR: Record<string, string> = {
  ABIERTO: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  EN_CURSO: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  CERRADO: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  VENCIDO: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function ActionPlanRow({ plan }: { plan: ActionPlan }) {
  const router = useRouter();
  const [status, setStatus] = useState(plan.status);
  const [saving, setSaving] = useState(false);

  async function updateStatus(value: string) {
    setStatus(value);
    setSaving(true);
    await fetch(`/api/action-plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {plan.noConformidad ? `NC N°${plan.noConformidad} · ` : ""}
            {plan.titulo}
          </p>
          {plan.legalRequirement && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Requisito N°{plan.legalRequirement.numero} ({plan.legalRequirement.ambito}) ·{" "}
              {plan.legalRequirement.titulo}
            </p>
          )}
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{plan.accionCorrectiva}</p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Responsable: {plan.responsable ?? "Sin asignar"}
            {plan.fechaEjecucion && ` · Fecha ejecución: ${new Date(plan.fechaEjecucion).toLocaleDateString("es-CL")}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[status]}`}>
            {STATUS_LABEL[status]}
          </span>
          <select
            value={status}
            disabled={saving}
            onChange={(e) => updateStatus(e.target.value)}
            className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
