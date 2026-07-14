import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTasksByResponsable, getResponsablesSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

const CUMPLE_LABEL: Record<string, string> = {
  SI: "Cumple",
  NO: "No cumple",
  NO_APLICA: "No aplica",
  PENDIENTE: "Pendiente",
};
const CUMPLE_COLOR: Record<string, string> = {
  SI: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30",
  NO: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30",
  NO_APLICA: "text-zinc-500 bg-zinc-100 dark:text-zinc-400 dark:bg-zinc-800",
  PENDIENTE: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30",
};
const STATUS_LABEL: Record<string, string> = {
  POR_GENERAR: "Por generar",
  EN_REVISION: "En revisión",
  VIGENTE: "Vigente",
  ACTUALIZAR: "Actualizar",
  VENCIDO: "Vencido",
};
const STATUS_COLOR: Record<string, string> = {
  POR_GENERAR: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30",
  EN_REVISION: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30",
  VIGENTE: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30",
  ACTUALIZAR: "text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30",
  VENCIDO: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30",
};

export default async function MisTareasPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Admin ve resumen de todos; usuario normal ve sus tareas
  if (session.isAdmin) {
    const summary = await getResponsablesSummary();
    return (
      <div className="min-h-full bg-zinc-50 dark:bg-black">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
          <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← Volver al dashboard</Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Avance por responsable</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Vista general del estado de tareas de cada persona.</p>
        </header>
        <main className="mx-auto max-w-4xl space-y-4 px-6 py-8">
          {summary.map((r) => {
            const pct = r.total > 0 ? Math.round((r.cumple / r.total) * 100) : 0;
            return (
              <div key={r.responsable} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{r.responsable}</p>
                    <p className="mt-1 text-sm text-zinc-500">{r.total} requisitos asignados</p>
                  </div>
                  <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{pct}%</span>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    ✓ Cumple: {r.cumple}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    ⏳ Pendiente: {r.pendiente}
                  </span>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    ✗ No cumple: {r.noCumple}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Sin evidencia: {r.sinEvidencia}
                  </span>
                </div>
              </div>
            );
          })}
        </main>
      </div>
    );
  }

  // Usuario normal — sus tareas pendientes
  if (!session.responsable) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">No tienes requisitos asignados.</p>
      </div>
    );
  }

  const tasks = await getTasksByResponsable(session.responsable);

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← Volver al dashboard</Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Mis tareas pendientes</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {session.name} · {tasks.length} requisito{tasks.length === 1 ? "" : "s"} requieren tu atención.
        </p>
      </header>
      <main className="mx-auto max-w-4xl space-y-3 px-6 py-8">
        {tasks.length === 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">¡Todo al día!</p>
            <p className="mt-1 text-sm text-green-600 dark:text-green-500">No tienes tareas pendientes en este momento.</p>
          </div>
        )}
        {tasks.map((r) => {
          const evidencePendiente = r.evidenceLinks.flatMap((l) =>
            l.evidenceTemplate.files.filter((f) => ["POR_GENERAR", "ACTUALIZAR", "VENCIDO"].includes(f.status))
          );
          const sinEvidencia = r.evidenceLinks.length === 0;

          return (
            <div key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-400">N°{r.numero} · {r.ambito}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CUMPLE_COLOR[r.cumple]}`}>
                      {CUMPLE_LABEL[r.cumple]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">{r.titulo}</p>
                  {r.articulo && <p className="mt-0.5 text-xs text-zinc-500">{r.articulo}</p>}
                </div>
              </div>

              {/* Qué debe hacer */}
              <div className="mt-3 space-y-1.5">
                {r.cumple === "PENDIENTE" && (
                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <span>⏳</span>
                    <span>Debes evaluar el estado de cumplimiento en Gestión de Requisitos</span>
                  </div>
                )}
                {r.cumple === "NO" && (
                  <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
                    <span>✗</span>
                    <span>Requisito marcado como No cumple — revisa el plan de acción</span>
                  </div>
                )}
                {sinEvidencia && (
                  <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <span>📎</span>
                    <span>Sin evidencia vinculada — debes subir el documento en Gestión de Requisitos</span>
                  </div>
                )}
                {evidencePendiente.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-xs">
                    <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS_COLOR[f.status]}`}>
                      {STATUS_LABEL[f.status]}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">{f.fileName ?? f.webUrl}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <Link
                  href={`/requisitos?q=${encodeURIComponent(r.titulo.slice(0, 40))}`}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  Ir a este requisito →
                </Link>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
