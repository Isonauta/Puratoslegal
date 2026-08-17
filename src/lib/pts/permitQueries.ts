import { prisma } from "@/lib/db";
import type { UserRole, PermitStatus, Prisma } from "@/generated/prisma/client";

export function permitWhereForRole(
  userId: string,
  role: UserRole
): Prisma.WorkPermitWhereInput {
  switch (role) {
    case "SOLICITANTE":
    case "CONTRATISTA":
      return { solicitanteId: userId };
    case "SUPERVISOR":
      return {
        OR: [
          { supervisorId: userId },
          { status: "ENVIADO_A_APROBACION" as PermitStatus },
          { status: "EN_CURSO" as PermitStatus },
        ],
      };
    case "SHE":
      return {
        status: {
          in: [
            "APROBADO_SUPERVISOR",
            "AUTORIZADO_SHE",
            "EN_CURSO",
            "CERRADO",
            "SUSPENDIDO",
          ] as PermitStatus[],
        },
      };
    case "ADMIN":
    default:
      return {};
  }
}

export async function listPermitsForUser(userId: string, role: UserRole) {
  return prisma.workPermit.findMany({
    where: permitWhereForRole(userId, role),
    include: {
      company: true,
      solicitante: true,
      supervisor: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdminMetrics() {
  const activeStatuses: PermitStatus[] = [
    "EN_CURSO",
    "ENVIADO_A_APROBACION",
    "APROBADO_SUPERVISOR",
    "AUTORIZADO_SHE",
    "SUSPENDIDO",
  ];

  const [byStatus, byArea, totalUsers, allPermits] = await Promise.all([
    prisma.workPermit.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.workPermit.groupBy({
      by: ["area"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    prisma.user.count(),
    prisma.workPermit.findMany({ select: { permitTypes: true } }),
  ]);

  const activeCount = byStatus
    .filter((s) => activeStatuses.includes(s.status))
    .reduce((sum, s) => sum + s._count.id, 0);

  const byType: Record<string, number> = {};
  for (const p of allPermits) {
    for (const t of p.permitTypes) {
      byType[t] = (byType[t] || 0) + 1;
    }
  }

  return { byStatus, byArea, totalUsers, activeCount, byType };
}
