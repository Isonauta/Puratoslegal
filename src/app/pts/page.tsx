import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/client";
import PtsNavBar from "@/components/pts/NavBar";
import { listPermitsForUser } from "@/lib/pts/permitQueries";
import { PERMIT_STATUS_LABELS, PERMIT_STATUS_COLORS } from "@/lib/pts/labels";

export const dynamic = "force-dynamic";

export default async function PtsDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?from=/pts");

  const userId = session.id;
  const role = (session.role ?? "ADMIN") as UserRole;

  if (!userId) redirect("/login");

  const permits = await listPermitsForUser(userId, role);

  return (
    <>
      <PtsNavBar userName={session.name ?? undefined} userRole={role} />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Permisos de Trabajo</h1>
          {(role === "SOLICITANTE" || role === "CONTRATISTA" || role === "ADMIN") && (
            <Link
              href="/pts/permits/new"
              className="bg-[#C41230] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9B0E26] transition-colors"
            >
              + Nuevo permiso
            </Link>
          )}
        </div>

        {permits.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No hay permisos</p>
            <p className="text-sm">
              {role === "SOLICITANTE" || role === "CONTRATISTA"
                ? "Crea un nuevo permiso para comenzar."
                : "No hay permisos asignados a tu rol en este momento."}
            </p>
          </div>
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
                  <span
                    className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                      PERMIT_STATUS_COLORS[permit.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {PERMIT_STATUS_LABELS[permit.status] ?? permit.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
