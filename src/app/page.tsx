import Link from "next/link";
import { ComplianceCard } from "@/components/ComplianceCard";
import {
  getComplianceByAmbito,
  getEvidenceStatusSummary,
  getNonCompliantRequirements,
  getOpenActionPlans,
  getOverallCompliance,
  getPermitsNeedingAttention,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [byAmbito, overall, nonCompliant, actionPlans, evidence, permits] = await Promise.all([
    getComplianceByAmbito(),
    getOverallCompliance(),
    getNonCompliantRequirements(),
    getOpenActionPlans(),
    getEvidenceStatusSummary(),
    getPermitsNeedingAttention(),
  ]);

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard de Cumplimiento Legal
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Matriz R-110-02 · Puratos
        </p>
        <div className="mt-3 flex gap-4">
          <Link href="/requisitos" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Gestionar requisitos y evidencia →
          </Link>
          <Link href="/planes-accion" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Ver planes de acción →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Cumplimiento global</p>
                <p className="mt-1 text-4xl font-bold text-zinc-900 dark:text-zinc-50">{overall.porcentaje}%</p>
              </div>
              <dl className="flex gap-6 text-sm">
                <div className="text-center">
                  <dd className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{overall.total}</dd>
                  <dt className="text-zinc-500 dark:text-zinc-400">Requisitos</dt>
                </div>
                <div className="text-center">
                  <dd className="text-lg font-semibold text-red-600 dark:text-red-400">{overall.noCumple}</dd>
                  <dt className="text-zinc-500 dark:text-zinc-400">Incumplidos</dt>
                </div>
                <div className="text-center">
                  <dd className="text-lg font-semibold text-amber-600 dark:text-amber-400">{overall.pendiente}</dd>
                  <dt className="text-zinc-500 dark:text-zinc-400">Sin evaluar</dt>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Cumplimiento por ámbito
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {byAmbito.map((a) => (
              <ComplianceCard key={a.ambito} data={a} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Requisitos incumplidos ({overall.noCumple})
            </h2>
            <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {nonCompliant.length === 0 && (
                <li className="py-3 text-sm text-zinc-500">Sin incumplimientos registrados.</li>
              )}
              {nonCompliant.map((r) => (
                <li key={r.id} className="py-3">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    N°{r.numero} · {r.ambito} — {r.titulo}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {r.organismo} · Responsable: {r.responsable ?? "Sin asignar"}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Planes de acción abiertos ({actionPlans.length})
            </h2>
            <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
              {actionPlans.length === 0 && (
                <li className="py-3 text-sm text-zinc-500">No hay planes de acción abiertos.</li>
              )}
              {actionPlans.map((p) => (
                <li key={p.id} className="py-3">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{p.titulo}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.accionCorrectiva}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Responsable: {p.responsable ?? "Sin asignar"}
                    {p.fechaEjecucion && ` · Vence: ${p.fechaEjecucion.toLocaleDateString("es-CL")}`}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Evidencia documental
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              {evidence.templatesWithFile} de {evidence.totalTemplates} plantillas tienen al menos un archivo
              vinculado.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
              {evidence.byTipo.map((t) => (
                <li key={t.tipoEvidencia} className="flex justify-between">
                  <span>{t.tipoEvidencia}</span>
                  <span className="font-medium">{t._count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Permisos que requieren atención ({permits.length})
            </h2>
            <ul className="mt-3 max-h-72 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
              {permits.map((p) => (
                <li key={p.id} className="py-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{p.nombre}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {p.organismoEmisor} · {p.estadoSugerido}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
