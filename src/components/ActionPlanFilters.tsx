"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { RESPONSABLES } from "./RequirementRow";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "ABIERTO", label: "Abierto" },
  { value: "EN_CURSO", label: "En curso" },
  { value: "CERRADO", label: "Cerrado" },
  { value: "VENCIDO", label: "Vencido" },
];

export function ActionPlanFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        defaultValue={params.get("status") ?? ""}
        onChange={(e) => update("status", e.target.value)}
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        defaultValue={params.get("responsable") ?? ""}
        onChange={(e) => update("responsable", e.target.value)}
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="">Todos los responsables</option>
        {RESPONSABLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  );
}
