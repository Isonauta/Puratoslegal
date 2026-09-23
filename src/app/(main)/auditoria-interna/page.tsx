import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import AuditoriaInternaClient from "./AuditoriaInternaClient";

export const dynamic = "force-dynamic";

export default async function AuditoriaInternaPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const raw = await prisma.auditoriaInterna.findMany({
    orderBy: [{ fechaPlan: "desc" }],
  });

  const items = raw.map((a) => ({
    ...a,
    fechaPlan: a.fechaPlan.toISOString(),
    fechaReal: a.fechaReal?.toISOString() ?? null,
    proximaAuditoria: a.proximaAuditoria?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return <AuditoriaInternaClient items={items} isAdmin={isAdmin} />;
}
