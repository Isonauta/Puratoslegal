import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import PlanesClient from "./PlanesClient";

export const dynamic = "force-dynamic";

export default async function PlanesPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const raw = await prisma.planActividad.findMany({
    orderBy: [{ programa: "asc" }, { codigoExterno: "asc" }],
  });

  const actividades = raw.map(a => ({
    ...a,
    inicio: a.inicio?.toISOString() ?? null,
    fin: a.fin?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return <PlanesClient actividades={actividades} isAdmin={isAdmin} />;
}
