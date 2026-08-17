import Link from "next/link";
import { Suspense } from "react";
import { getAllActionPlans, getRequirementsNeedingActionPlan } from "@/lib/queries";
import { ActionPlanRow } from "@/components/ActionPlanRow";
import { CreateActionPlanButton, type Req } from "@/components/CreateActionPlanButton";
import { ActionPlanFilters } from "@/components/ActionPlanFilters";
import { LeyCard } from "@/components/LeyCard";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_CURSO: "En curso",
  CERRADO: "Cerrado",
  VENCIDO: "Vencido",
};

const STAT_STYLE: Record<string, { card: string; num: string; label: string }> = {
  ABIERTO:  { card: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",  num: "text-amber-700 dark:text-amber-300",  label: "text-amber-600 dark:text-amber-400" },
  EN_CURSO: { card: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",      num: "text-blue-700 dark:text-blue-300",    label: "text-blue-600 dark:text-blue-400" },
  CERRADO:  { card: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",  num: "text-green-700 dark:text-green-300",  label: "text-green-600 dark:text-green-400" },
  VENCIDO:  { card: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",          num: "text-red-700 dark:text-red-300",      label: "text-red-600 dark:text-red-400" },
};

type PageProps = {
  searchParams: Promise<{ status?: string; responsable?: string }>;
};

function leyKey(r: Req) {
  return `${r.tipoDocumento}|${r.documentoNumero ?? ""}`;
}

function groupByLey(reqs: Req[]): Map<string, Req[]> {
  const map = new Map<string, Req[]>();
  for (const r of reqs) {
    const k = leyKey(r);
    const arr = map.get(k) ?? [];
    arr.push(r);
    map.set(k, arr);
  }
  return map;
}

export default async function PlanesAccionPage({ searchParams }: PageProps) {
  const { status: filterStatus, responsable: filterResponsable } = await searchParams;

  const [allPlans, { noCumple, sinEvidencia }] = await Promise.all([
    getAllActionPlans(),
    getRequirementsNeedingActionPlan(),
  ]);

  // Excluir planes cuyo requisito vinculado ahora es NO_APLICA
  const activePlans = allPlans.filter((p) => p.legalRequirement?.cumple !== "NO_APLICA");

  const counts = {
    ABIERTO:  activePlans.filter((p) => p.status === "ABIERTO").length,
    EN_CURSO: activePlans.filter((p) => p.status === "EN_CURSO").length,
    CERRADO:  activePlans.filter((p) => p.status === "CERRADO").length,
    VENCIDO:  activePlans.filter((p) => p.status === "VENCIDO").length,
  };

  const plans = activePlans.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterResponsable && p.responsable !== filterResponsable) return false;
    return true;
  });

  // A law is "covered" if any of its requirements already has a plan (ignoring NO_APLICA plans).
  const coveredReqIds = new Set(activePlans.map((p) => p.legalRequirementId).filter(Boolean));
  const coveredLeyKeys = new Set(
    activePlans
      .map((p) => {
        const lr = p.legalRequirement;
        if (!lr || !lr.tipoDocumento) return null;
        return `${lr.tipoDocumento}|${lr.documentoNumero ?? ""}`;
      })
      .filter(Boolean) as string[]
  );

  const noCumpleSinPlan = noCumple.filter(
    (r) => !coveredReqIds.has(r.id) && !coveredLeyKeys.has(leyKey(r))
  );
  const sinEvidenciaSinPlan = sinEvidencia.filter(
    (r) => !coveredReqIds.has(r.id) && !coveredLeyKeys.has(leyKey(r))
  );

  const noCumpleGrupos = groupByLey(noCumpleSinPlan);
  const sinEvidenciaGrupos = groupByLey(sinEvidenciaSinPlan);
  const totalPendientes = noCumpleGrupos.size + sinEvidenciaGrupos.size;

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Volver al dashboard
            </Link>
            <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Planes de Acción
            </h1>
          </div>
          <Link
            href="/requisitos"
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Ir a Requisitos
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">

        {/* Resumen */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Resumen general
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["ABIERTO", "EN_CURSO", "CERRADO", "VENCIDO"] as const).map((s) => (
              <div key={s} className={`rounded-lg border p-4 text-center ${STAT_STYLE[s].card}`}>
                <p className={`text-3xl font-bold ${STAT_STYLE[s].num}`}>{counts[s]}</p>
                <p className={`mt-1 text-xs font-medium ${STAT_STYLE[s].label}`}>{STATUS_LABEL[s]}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Total: {activePlans.length} plan{activePlans.length !== 1 ? "es" : ""} ·{" "}
            {totalPendientes > 0
              ? `${totalPendientes} ley${totalPendientes !== 1 ? "es" : ""} sin plan aún`
              : "todas las leyes detectadas tienen plan"}
          </p>
        </section>

        {/* Planes creados */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Planes creados ({plans.length}{activePlans.length !== plans.length ? ` de ${activePlans.length}` : ""})
            </h2>
            <Suspense>
              <ActionPlanFilters />
            </Suspense>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {allPlans.length === 0
                  ? "Aún no hay planes. Usa \"+ Crear plan\" en las leyes de abajo."
                  : "Ningún plan coincide con los filtros seleccionados."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((p) => (
                <ActionPlanRow key={p.id} plan={p} />
              ))}
            </div>
          )}
        </section>

        {totalPendientes === 0 && activePlans.length === 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">¡Sin pendientes!</p>
            <p className="mt-1 text-sm text-green-600 dark:text-green-500">
              No hay requisitos incumplidos ni sin evidencia en este momento.
            </p>
          </div>
        )}

        {/* Sin plan — agrupado por ley */}
        {(noCumpleGrupos.size > 0 || sinEvidenciaGrupos.size > 0) && (
          <section>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Sin plan aún — leyes que requieren acción
            </h2>
            <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">
              Cada tarjeta representa una ley. Un plan de acción cubre todos sus artículos.
            </p>

            {noCumpleGrupos.size > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
                  ✗ No cumplen — {noCumpleGrupos.size} ley{noCumpleGrupos.size !== 1 ? "es" : ""}
                </p>
                <div className="space-y-2">
                  {[...noCumpleGrupos.entries()].map(([key, reqs]) => (
                    <LeyCard key={key} reqs={reqs} color="red" />
                  ))}
                </div>
              </div>
            )}

            {sinEvidenciaGrupos.size > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-orange-600 dark:text-orange-400">
                  ⚠ Cumple sin evidencia — {sinEvidenciaGrupos.size} ley{sinEvidenciaGrupos.size !== 1 ? "es" : ""}
                </p>
                <div className="space-y-2">
                  {[...sinEvidenciaGrupos.entries()].map(([key, reqs]) => (
                    <LeyCard key={key} reqs={reqs} color="orange" />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

