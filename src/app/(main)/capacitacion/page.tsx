import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import CapacitacionClient from "./CapacitacionClient";

export const dynamic = "force-dynamic";

export default async function CapacitacionPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const raw = await prisma.capacitacion.findMany({
    orderBy: [{ fechaPlan: "desc" }],
  });

  const items = raw.map((c) => ({
    ...c,
    fechaPlan: c.fechaPlan.toISOString(),
    fechaReal: c.fechaReal?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <CapacitacionClient items={items} isAdmin={isAdmin} />;
}
