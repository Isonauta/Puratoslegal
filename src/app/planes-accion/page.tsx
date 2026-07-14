import Link from "next/link";
import { getAllActionPlans, getRequirementsNeedingActionPlan } from "@/lib/queries";
import { ActionPlanRow } from "@/components/ActionPlanRow";
import { CreateActionPlanButton } from "@/components/CreateActionPlanButton";

export const dynamic = "force-dynamic";

export default async function PlanesAccionPage() {
  const [plans, { noCumple, sinEvidencia }] = await Promise.all([
    getAllActionPlans(),
    getRequirementsNeedingActionPlan(),
  ]);

  const abiertos = plans.filter((p) => p.status !== "CERRADO").length;
  const conPlan = new Set(plans.map((p) => p.legalRequirementId).filter(Boolean));

  const noCumpleSinPlan = noCumple.filter((r) => !conPlan.has(r.id));
  const sinEvidenciaSinPlan = sinEvidencia.filter((r) => !conPlan.has(r.id));
  const totalPendientes = noCumpleSinPlan.length + sinEvidenciaSinPlan.length;

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Volver al dashboard
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Planes de Acción</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {totalPendientes > 0
                ? `${totalPendientes} requisito${totalPendientes === 1 ? "" : "s"} sin plan · ${abiertos} plan${abiertos === 1 ? "" : "es"} abierto${abiertos === 1 ? "" : "s"}`
                : `${abiertos} plan${abiertos === 1 ? "" : "es"} abierto${abiertos === 1 ? "" : "s"}`}
            </p>
          </div>
          <Link
            href="/requisitos"
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Ir a Requisitos
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-8">

        {/* Detectados automáticamente sin plan */}
        {(noCumpleSinPlan.length > 0 || sinEvidenciaSinPlan.length > 0) && (
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Detectados automáticamente — sin plan aún
            </h2>

            {noCumpleSinPlan.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-red-600 dark:text-red-400">
                  ✗ No cumplen ({noCumpleSinPlan.length})
                </p>
                <div className="space-y-2">
                  {noCumpleSinPlan.map((r) => (
                    <div key={r.id} className="rounded-lg border border-red-100 bg-white p-4 dark:border-red-900/50 dark:bg-zinc-900">
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
                    <div key={r.id} className="rounded-lg border border-orange-100 bg-white p-4 dark:border-orange-900/50 dark:bg-zinc-900">
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

        {/* Planes formales creados */}
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Planes creados ({plans.length})
          </h2>
          {plans.length === 0 ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Aún no hay planes formales. Usa "+ Crear plan" en los requisitos de arriba.
            </p>
          ) : (
            <div className="space-y-3">
              {plans.map((p) => (
                <ActionPlanRow key={p.id} plan={p} />
              ))}
            </div>
          )}
        </section>

        {totalPendientes === 0 && plans.length === 0 && (
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
