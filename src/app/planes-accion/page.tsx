import Link from "next/link";
import { Suspense } from "react";
import { getAllActionPlans, getRequirementsNeedingActionPlan } from "@/lib/queries";
import { ActionPlanRow } from "@/components/ActionPlanRow";
import { CreateActionPlanButton } from "@/components/CreateActionPlanButton";
import { ActionPlanFilters } from "@/components/ActionPlanFilters";

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

export default async function PlanesAccionPage({ searchParams }: PageProps) {
  const { status: filterStatus, responsable: filterResponsable } = await searchParams;

  const [allPlans, { noCumple, sinEvidencia }] = await Promise.all([
    getAllActionPlans(),
    getRequirementsNeedingActionPlan(),
  ]);

  // Contadores globales (sin filtro)
  const counts = {
    ABIERTO:  allPlans.filter((p) => p.status === "ABIERTO").length,
    EN_CURSO: allPlans.filter((p) => p.status === "EN_CURSO").length,
    CERRADO:  allPlans.filter((p) => p.status === "CERRADO").length,
    VENCIDO:  allPlans.filter((p) => p.status === "VENCIDO").length,
  };

  // Planes filtrados para la tabla
  const plans = allPlans.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterResponsable && p.responsable !== filterResponsable) return false;
    return true;
  });

  const conPlan = new Set(allPlans.map((p) => p.legalRequirementId).filter(Boolean));
  const noCumpleSinPlan = noCumple.filter((r) => !conPlan.has(r.id));
  const sinEvidenciaSinPlan = sinEvidencia.filter((r) => !conPlan.has(r.id));
  const totalPendientes = noCumpleSinPlan.length + sinEvidenciaSinPlan.length;

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      {/* Header */}
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

        {/* Panel de resumen */}
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
            Total: {allPlans.length} plan{allPlans.length !== 1 ? "es" : ""} ·{" "}
            {totalPendientes > 0
              ? `${totalPendientes} requisito${totalPendientes !== 1 ? "s" : ""} sin plan aún`
              : "todos los requisitos detectados tienen plan"}
          </p>
        </section>

        {/* Requisitos sin plan (detectados automáticamente) */}
        {(noCumpleSinPlan.length > 0 || sinEvidenciaSinPlan.length > 0) && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Detectados sin plan — crear acción correctiva
            </h2>

            {noCumpleSinPlan.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
                  ✗ No cumplen ({noCumpleSinPlan.length})
                </p>
                <div className="space-y-2">
                  {noCumpleSinPlan.map((r) => (
                    <div key={r.id} className="rounded-lg border border-l-4 border-red-200 border-l-red-400 bg-white p-4 dark:border-red-900/50 dark:bg-zinc-900">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            N°{r.numero} · {r.ambito} — {r.titulo}
                          </p>
                          {r.responsable && (
                            <p className="mt-0.5 text-xs text-zinc-500">Responsable: {r.responsable}</p>
                          )}
                        </div>
                        <CreateActionPlanButton req={r} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sinEvidenciaSinPlan.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-orange-600 dark:text-orange-400">
                  ⚠ Cumple sin evidencia ({sinEvidenciaSinPlan.length})
                </p>
                <div className="space-y-2">
                  {sinEvidenciaSinPlan.map((r) => (
                    <div key={r.id} className="rounded-lg border border-l-4 border-orange-200 border-l-orange-400 bg-white p-4 dark:border-orange-900/50 dark:bg-zinc-900">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            N°{r.numero} · {r.ambito} — {r.titulo}
                          </p>
                          {r.responsable && (
                            <p className="mt-0.5 text-xs text-zinc-500">Responsable: {r.responsable}</p>
                          )}
                        </div>
                        <CreateActionPlanButton req={r} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tabla de planes creados */}
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Planes creados ({plans.length}{allPlans.length !== plans.length ? ` de ${allPlans.length}` : ""})
            </h2>
            <Suspense>
              <ActionPlanFilters />
            </Suspense>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {allPlans.length === 0
                  ? "Aún no hay planes. Usa \"+ Crear plan\" en los requisitos de arriba."
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

        {totalPendientes === 0 && allPlans.length === 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">¡Sin pendientes!</p>
            <p className="mt-1 text-sm text-green-600 dark:text-green-500">
              No hay requisitos incumplidos ni sin evidencia en este momento.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
