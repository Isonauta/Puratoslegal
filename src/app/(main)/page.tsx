import Link from "next/link";
import { ComplianceCard } from "@/components/ComplianceCard";
import DashboardHero from "@/components/DashboardHero";
import { getSession } from "@/lib/auth";
import {
  getComplianceByAmbito,
  getEvidenceStatusSummary,
  getNonCompliantRequirements,
  getOpenActionPlans,
  getOverallCompliance,
  getPermitsNeedingAttention,
  getResponsablesSummary,
  getTasksByResponsable,
  getDocumentosSigStats,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const [byAmbito, overall, nonCompliant, actionPlans, evidence, permits, responsablesSummary, myTasks, sigStats] = await Promise.all([
    getComplianceByAmbito(),
    getOverallCompliance(),
    getNonCompliantRequirements(),
    getOpenActionPlans(),
    getEvidenceStatusSummary(),
    getPermitsNeedingAttention(),
    session?.isAdmin ? getResponsablesSummary() : Promise.resolve(null),
    session?.responsable ? getTasksByResponsable(session.responsable) : Promise.resolve(null),
    getDocumentosSigStats(),
  ]);

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 sm:py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard de Cumplimiento Legal
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Matriz R-110-02 · Purasafe
        </p>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
        <DashboardHero
          name={session?.name ?? session?.email ?? ""}
          overallPct={overall.porcentaje}
        />

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

        {/* Evidencia — sección destacada */}
        <section>
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Evidencia documental
                </h2>
                <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  {evidence.templatesWithFile}
                  <span className="ml-1 text-base font-normal text-zinc-400">/ {evidence.totalTemplates} plantillas con archivo</span>
                </p>
              </div>
              {evidence.filesByStatus.length > 0 && (() => {
                const total = evidence.filesByStatus.reduce((s, f) => s + f._count, 0);
                const vigente = evidence.filesByStatus.find(f => f.status === "VIGENTE")?._count ?? 0;
                return (
                  <div className="text-right">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Archivos vigentes</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {total > 0 ? Math.round((vigente / total) * 100) : 0}%
                    </p>
                    <p className="text-xs text-zinc-400">{vigente} de {total} archivos</p>
                  </div>
                );
              })()}
            </div>

            {evidence.filesByStatus.length > 0 && (() => {
              const total = evidence.filesByStatus.reduce((s, f) => s + f._count, 0);
              const order = ["VIGENTE", "EN_REVISION", "POR_GENERAR", "ACTUALIZAR", "VENCIDO"];
              const label: Record<string, string> = {
                VIGENTE: "Vigente",
                EN_REVISION: "En revisión",
                POR_GENERAR: "Por generar",
                ACTUALIZAR: "Actualizar",
                VENCIDO: "Vencido",
              };
              const color: Record<string, string> = {
                VIGENTE: "bg-green-500",
                EN_REVISION: "bg-blue-400",
                POR_GENERAR: "bg-amber-400",
                ACTUALIZAR: "bg-orange-400",
                VENCIDO: "bg-red-500",
              };
              const textColor: Record<string, string> = {
                VIGENTE: "text-green-700 dark:text-green-400",
                EN_REVISION: "text-blue-700 dark:text-blue-400",
                POR_GENERAR: "text-amber-700 dark:text-amber-400",
                ACTUALIZAR: "text-orange-700 dark:text-orange-400",
                VENCIDO: "text-red-700 dark:text-red-400",
              };
              const sorted = [...evidence.filesByStatus].sort(
                (a, b) => order.indexOf(a.status) - order.indexOf(b.status)
              );
              return (
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800 sm:grid-cols-3 lg:grid-cols-5">
                  {order.map((status) => {
                    const entry = sorted.find(f => f.status === status);
                    const count = entry?._count ?? 0;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block h-2 w-2 rounded-full ${color[status]}`} />
                          <span className={`text-xs font-medium ${textColor[status]}`}>{label[status]}</span>
                        </div>
                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{count}</p>
                        <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div className={`h-1 rounded-full ${color[status]}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-zinc-400">{pct}%</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

        {/* Avance por responsable — admin ve todos, usuario normal ve sus tareas */}
        {session?.isAdmin && responsablesSummary && responsablesSummary.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Avance por responsable
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {responsablesSummary.map((r) => {
                const pct = r.total > 0 ? Math.round((r.cumple / r.total) * 100) : 0;
                const attention = r.pendiente + r.noCumple + r.cumpleSinEvidencia;
                return (
                  <div key={r.responsable} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{r.responsable}</p>
                      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">con evidencia / {r.total} requisitos</p>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <span className="text-green-700 dark:text-green-400">✓ {r.cumple} cumple</span>
                      {r.cumpleSinEvidencia > 0
                        ? <span className="text-orange-600 dark:text-orange-400">⚠ {r.cumpleSinEvidencia} sin evidencia</span>
                        : <span className="text-zinc-400">— sin evidencia faltante</span>
                      }
                      {r.pendiente > 0
                        ? <span className="text-amber-600 dark:text-amber-400">⏳ {r.pendiente} sin evaluar</span>
                        : <span className="text-zinc-400">— todo evaluado</span>
                      }
                      {r.noCumple > 0
                        ? <span className="text-red-600 dark:text-red-400">✗ {r.noCumple} no cumple</span>
                        : <span className="text-zinc-400">— sin incumplimientos</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 text-right">
              <Link href="/mis-tareas" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                Ver detalle por responsable →
              </Link>
            </div>
          </section>
        )}

        {!session?.isAdmin && myTasks !== null && (
          <section>
            <Link
              href="/mis-tareas"
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Mis tareas pendientes</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {myTasks.length === 0 ? "¡Todo al día!" : `${myTasks.length} requisito${myTasks.length === 1 ? "" : "s"} requieren tu atención`}
                </p>
              </div>
              <span className={`text-2xl font-bold ${myTasks.length === 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                {myTasks.length === 0 ? "✓" : myTasks.length}
              </span>
            </Link>
          </section>
        )}

        {/* Manual del SIG — estado de documentos */}
        {sigStats.total > 0 && (
          <section>
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Manual del SIG
                  </h2>
                  <p className="mt-1 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                    {sigStats.total}
                    <span className="ml-1 text-base font-normal text-zinc-400">documentos</span>
                  </p>
                </div>
                <Link href="/sig" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                  Ir al Manual →
                </Link>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800 sm:grid-cols-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">Al día</span>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{sigStats.vigentes}</p>
                  <p className="text-xs text-zinc-400">revisión &gt; 60 días</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Por revisar</span>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{sigStats.porRevisar}</p>
                  <p className="text-xs text-zinc-400">revisión próxima en &lt; 60 días</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-xs font-medium text-red-700 dark:text-red-400">Vencidos</span>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{sigStats.vencidos}</p>
                  <p className="text-xs text-zinc-400">revisión ya vencida</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">En flujo</span>
                  </div>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{sigStats.enFlujo}</p>
                  <p className="text-xs text-zinc-400">borrador / revisión / aprobación</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Requisitos incumplidos — referencia secundaria */}
        <section>
          <details className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="cursor-pointer px-5 py-4 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Requisitos incumplidos ({overall.noCumple}) — ver detalle
            </summary>
            <ul className="divide-y divide-zinc-100 px-5 pb-4 dark:divide-zinc-800">
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
          </details>
        </section>
      </main>
    </div>
  );
}
