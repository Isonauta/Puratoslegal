import Link from "next/link";
import { getAllRequirements } from "@/lib/queries";
import type { RequirementFilters } from "@/lib/queries";
import { RequirementRow } from "@/components/RequirementRow";
import { RequirementFiltersBar } from "@/components/RequirementFiltersBar";
import type { Ambito, CumpleEstado } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

const AMBITOS: Ambito[] = ["SST", "MA", "SGI", "GENERAL"];
const CUMPLE_VALUES: CumpleEstado[] = ["SI", "NO", "NO_APLICA", "PENDIENTE"];

export default async function RequisitosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters: RequirementFilters = {
    ambito: AMBITOS.includes(params.ambito as Ambito) ? (params.ambito as Ambito) : undefined,
    cumple: CUMPLE_VALUES.includes(params.cumple as CumpleEstado) ? (params.cumple as CumpleEstado) : undefined,
    evidencia: params.evidencia === "con" || params.evidencia === "sin" ? params.evidencia : undefined,
    q: params.q || undefined,
  };

  const requirements = await getAllRequirements(filters);
  const exportQuery = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Volver al dashboard
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Gestión de Requisitos y Evidencia
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {requirements.length} requisito{requirements.length === 1 ? "" : "s"} · actualiza el cumplimiento y
              vincula evidencia (SharePoint / Google Drive).
            </p>
          </div>
          <a
            href={`/api/export/requisitos${exportQuery ? `?${exportQuery}` : ""}`}
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Exportar a Excel
          </a>
        </div>
        <RequirementFiltersBar filters={filters} />
      </header>

      <main className="mx-auto max-w-6xl space-y-3 px-6 py-8">
        {requirements.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Ningún requisito coincide con estos filtros.</p>
        )}
        {requirements.map((r) => (
          <RequirementRow key={r.id} requirement={r} />
        ))}
      </main>
    </div>
  );
}
