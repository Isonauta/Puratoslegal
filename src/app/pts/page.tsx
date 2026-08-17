import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/client";
import PtsNavBar from "@/components/pts/NavBar";
import DashboardHero from "@/components/pts/DashboardHero";
import VideoSection from "@/components/pts/VideoSection";
import { listPermitsForUser, getAdminMetrics } from "@/lib/pts/permitQueries";
import {
  PERMIT_STATUS_LABELS,
  PERMIT_STATUS_COLORS,
  PERMIT_TYPE_LABELS,
} from "@/lib/pts/labels";

export const dynamic = "force-dynamic";

export default async function PtsDashboard({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?from=/pts");

  const { vista } = await searchParams;
  const userId = session.id ?? "";
  const role = (session.role ?? "ADMIN") as UserRole;

  const isAdmin = role === "ADMIN";
  const vistaUsuario = isAdmin && vista === "usuario";
  const showAdminView = isAdmin && !vistaUsuario;

  const [permits, adminMetrics] = await Promise.all([
    listPermitsForUser(vistaUsuario ? userId : userId, vistaUsuario ? ("SOLICITANTE" as UserRole) : role),
    showAdminView ? getAdminMetrics() : Promise.resolve(null),
  ]);

  return (
    <>
      <PtsNavBar userName={session.name ?? undefined} userRole={role} />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">

        <DashboardHero name={session.name ?? session.email} />

        {isAdmin && (
          <div className="flex justify-end">
            <Link
              href={vistaUsuario ? "/pts" : "/pts?vista=usuario"}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#C41230] border border-[#C41230] rounded-lg px-3 py-2 hover:bg-red-50 transition-colors"
            >
              {vistaUsuario ? "Volver a vista Administrador" : "Ver como usuario"}
            </Link>
          </div>
        )}

        {showAdminView && adminMetrics && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Resumen de actividad</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Total permisos</span>
                <span className="text-2xl font-bold text-gray-900">
                  {adminMetrics.byStatus.reduce((s, r) => s + r._count.id, 0)}
                </span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Activos</span>
                <span className="text-2xl font-bold text-[#C41230]">
                  {adminMetrics.activeCount}
                </span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Usuarios</span>
                <span className="text-2xl font-bold text-gray-900">
                  {adminMetrics.totalUsers}
                </span>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Áreas activas</span>
                <span className="text-2xl font-bold text-gray-900">
                  {adminMetrics.byArea.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Por estado</p>
                <ul className="space-y-2">
                  {adminMetrics.byStatus.map((s) => (
                    <li key={s.status} className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PERMIT_STATUS_COLORS[s.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {PERMIT_STATUS_LABELS[s.status] ?? s.status}
                      </span>
                      <span className="text-sm font-bold text-gray-700">{s._count.id}</span>
                    </li>
                  ))}
                  {adminMetrics.byStatus.length === 0 && <li className="text-xs text-gray-400">Sin datos aún</li>}
                </ul>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Por área (top 8)</p>
                <ul className="space-y-2">
                  {adminMetrics.byArea.map((a) => (
                    <li key={a.area} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-gray-700 truncate">{a.area}</span>
                      <span className="text-sm font-bold text-gray-700 shrink-0">{a._count.id}</span>
                    </li>
                  ))}
                  {adminMetrics.byArea.length === 0 && <li className="text-xs text-gray-400">Sin datos aún</li>}
                </ul>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Por tipo de permiso</p>
                <ul className="space-y-2">
                  {Object.entries(adminMetrics.byType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <li key={type} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-700 truncate">{PERMIT_TYPE_LABELS[type] ?? type}</span>
                        <span className="text-sm font-bold text-gray-700 shrink-0">{count}</span>
                      </li>
                    ))}
                  {Object.keys(adminMetrics.byType).length === 0 && <li className="text-xs text-gray-400">Sin datos aún</li>}
                </ul>
              </div>
            </div>
          </section>
        )}

        <VideoSection />

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {showAdminView ? "Todos los permisos" : "Mis permisos de trabajo"}
            </h2>
            {(role === "SOLICITANTE" || role === "CONTRATISTA" || role === "ADMIN") && (
              <Link href="/pts/permits/new" className="text-sm font-semibold text-[#C41230] hover:underline">
                + Nuevo PTS
              </Link>
            )}
          </div>

          {permits.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay permisos de trabajo para mostrar.</p>
          ) : (
            <div className="space-y-3">
              {permits.map((permit) => (
                <Link
                  key={permit.id}
                  href={`/pts/permits/${permit.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-[#C41230] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{permit.taskDescription}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {permit.area} · {permit.date ? new Date(permit.date).toLocaleDateString("es-CL") : "—"}
                      </p>
                      {permit.company && (
                        <p className="text-xs text-gray-400 mt-0.5">{permit.company.name}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${PERMIT_STATUS_COLORS[permit.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {PERMIT_STATUS_LABELS[permit.status] ?? permit.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>
    </>
  );
}
