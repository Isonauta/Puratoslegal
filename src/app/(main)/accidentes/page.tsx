import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import AccidentesClient from "./AccidentesClient";

export const dynamic = "force-dynamic";

export default async function AccidentesPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const raw = await prisma.accidenteStat.findMany({
    orderBy: [{ anio: "desc" }, { mes: "desc" }, { area: "asc" }],
  });

  const stats = raw.map(s => ({ ...s, createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() }));

  return <AccidentesClient stats={stats} isAdmin={isAdmin} />;
}
