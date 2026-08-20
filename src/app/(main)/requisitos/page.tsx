import Link from "next/link";
import { getAllRequirements, getLeyesDisponibles, getAllActionPlans } from "@/lib/queries";
import type { RequirementFilters } from "@/lib/queries";
import { LawGroupCard } from "@/components/LawGroupCard";
import { RequirementFiltersBar } from "@/components/RequirementFiltersBar";
import { NewRequirementModal } from "@/components/NewRequirementModal";
import { getSession } from "@/lib/auth";
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
    alcance: params.alcance === "revisar" || params.alcance === "fuera" ? params.alcance : undefined,
    ley: params.ley || undefined,
    q: params.q || undefined,
  };

  const session = await getSession();
  const [requirements, leyes, allPlans] = await Promise.all([
    getAllRequirements(filters),
    getLeyesDisponibles(),
    getAllActionPlans(),
  ]);

  const coveredLeyKeys = new Set(
    allPlans
      .map((p) => {
        const lr = p.legalRequirement;
        if (!lr?.tipoDocumento) return null;
        return `${lr.tipoDocumento}|${lr.documentoNumero ?? ""}`;
      })
      .filter(Boolean) as string[]
  );

  // Group by law
  type LawGroup = { key: string; tipoDocumento: string; documentoNumero: string | null; organismo: string; items: typeof requirements };
  const lawMap = new Map<string, LawGroup>();
  for (const r of requirements) {
    const key = `${r.tipoDocumento}|${r.documentoNumero ?? ""}`;
    if (!lawMap.has(key)) {
      lawMap.set(key, { key, tipoDocumento: r.tipoDocumento, documentoNumero: r.documentoNumero, organismo: r.organismo, items: [] });
    }
    lawMap.get(key)!.items.push(r);
  }
  const groups = [...lawMap.values()];

  const exportQuery = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 sm:py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Volver al dashboard
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Requisitos Legales
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {groups.length} ley{groups.length === 1 ? "" : "es"} · {requirements.length} artículo{requirements.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {session?.isAdmin && <NewRequirementModal />}
            <a
              href={`/api/export/requisitos${exportQuery ? `?${exportQuery}` : ""}`}
              className="shrink-0 rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Exportar
            </a>
          </div>
        </div>
        <RequirementFiltersBar filters={filters} leyes={leyes} />
      </header>

      <main className="mx-auto max-w-6xl space-y-3 px-3 py-6 sm:px-6 sm:py-8">
        {groups.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Ningún requisito coincide con estos filtros.</p>
        )}
        {groups.map((g) => (
          <LawGroupCard
            key={g.key}
            tipoDocumento={g.tipoDocumento}
            documentoNumero={g.documentoNumero}
            organismo={g.organismo}
            requirements={g.items}
            coveredLeyKeys={coveredLeyKeys}
            isAdmin={session?.isAdmin ?? false}
          />
        ))}
      </main>
    </div>
  );
}
