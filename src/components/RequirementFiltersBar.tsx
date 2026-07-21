"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RequirementFilters } from "@/lib/queries";

const AMBITO_OPTIONS = ["SST", "MA", "SGI", "GENERAL"];
const CUMPLE_OPTIONS = ["SI", "NO", "NO_APLICA", "PENDIENTE"];
const CUMPLE_LABEL: Record<string, string> = {
  SI: "Cumple",
  NO: "No cumple",
  NO_APLICA: "No aplica",
  PENDIENTE: "Pendiente",
};

export function RequirementFiltersBar({ filters, leyes }: { filters: RequirementFilters; leyes: { key: string; label: string }[] }) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q ?? "");

  function pushFilters(next: RequirementFilters) {
    const params = new URLSearchParams(
      Object.entries(next).filter(([, v]) => v !== undefined && v !== "") as [string, string][]
    );
    router.push(`/requisitos${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        pushFilters({ ...filters, q: q || undefined });
      }}
      className="mt-4 flex flex-wrap items-center gap-2"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por título, artículo, organismo..."
        className="w-64 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
      <select
        value={filters.ambito ?? ""}
        onChange={(e) => pushFilters({ ...filters, ambito: (e.target.value || undefined) as RequirementFilters["ambito"] })}
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="">Todos los ámbitos</option>
        {AMBITO_OPTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <select
        value={filters.cumple ?? ""}
        onChange={(e) => pushFilters({ ...filters, cumple: (e.target.value || undefined) as RequirementFilters["cumple"] })}
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="">Todos los estados</option>
        {CUMPLE_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {CUMPLE_LABEL[c]}
          </option>
        ))}
      </select>
      <select
        value={filters.evidencia ?? ""}
        onChange={(e) => pushFilters({ ...filters, evidencia: (e.target.value || undefined) as RequirementFilters["evidencia"] })}
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="">Con o sin evidencia</option>
        <option value="con">Con evidencia</option>
        <option value="sin">Sin evidencia</option>
      </select>
      <select
        value={filters.alcance ?? ""}
        onChange={(e) => pushFilters({ ...filters, alcance: (e.target.value || undefined) as RequirementFilters["alcance"] })}
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="">Todo el alcance SIG</option>
        <option value="revisar">⚠ Por revisar aplicabilidad</option>
        <option value="fuera">Fuera de alcance SIG</option>
      </select>
      <select
        value={filters.ley ?? ""}
        onChange={(e) => pushFilters({ ...filters, ley: e.target.value || undefined })}
        className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      >
        <option value="">Todas las leyes y decretos</option>
        {leyes.map((l) => (
          <option key={l.key} value={l.key}>{l.label}</option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Buscar
      </button>
      {(filters.ambito || filters.cumple || filters.evidencia || filters.alcance || filters.ley || filters.q) && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push("/requisitos");
          }}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Limpiar filtros
        </button>
      )}
    </form>
  );
}
