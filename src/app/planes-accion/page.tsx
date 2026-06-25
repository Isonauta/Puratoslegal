import Link from "next/link";
import { getAllActionPlans } from "@/lib/queries";
import { ActionPlanRow } from "@/components/ActionPlanRow";

export const dynamic = "force-dynamic";

export default async function PlanesAccionPage() {
  const plans = await getAllActionPlans();
  const abiertos = plans.filter((p) => p.status !== "CERRADO").length;

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
              {plans.length} plan{plans.length === 1 ? "" : "es"} · {abiertos} pendiente{abiertos === 1 ? "" : "s"} de
              cierre.
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

      <main className="mx-auto max-w-6xl space-y-3 px-6 py-8">
        {plans.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No hay planes de acción registrados.</p>
        )}
        {plans.map((p) => (
          <ActionPlanRow key={p.id} plan={p} />
        ))}
      </main>
    </div>
  );
}
