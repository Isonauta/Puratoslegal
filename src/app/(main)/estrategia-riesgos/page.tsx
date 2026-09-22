import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import EstrategiaRiesgosClient from "./EstrategiaRiesgosClient";

export const dynamic = "force-dynamic";

export default async function EstrategiaRiesgosPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const raw = await prisma.riesgoOportunidad.findMany({
    orderBy: [{ nivelRiesgo: "desc" }, { createdAt: "desc" }],
  });

  const items = raw.map((r) => ({
    ...r,
    fechaRevision: r.fechaRevision?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <EstrategiaRiesgosClient items={items} isAdmin={isAdmin} />;
}
