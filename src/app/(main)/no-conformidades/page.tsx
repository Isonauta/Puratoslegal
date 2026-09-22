import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import NoConformidadesClient from "./NoConformidadesClient";

export const dynamic = "force-dynamic";

export default async function NoConformidadesPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const raw = await prisma.noConformidad.findMany({
    orderBy: [{ estado: "asc" }, { fechaDeteccion: "desc" }],
  });

  const items = raw.map((nc) => ({
    ...nc,
    fechaDeteccion: nc.fechaDeteccion.toISOString(),
    fechaLimite: nc.fechaLimite?.toISOString() ?? null,
    fechaCierre: nc.fechaCierre?.toISOString() ?? null,
    createdAt: nc.createdAt.toISOString(),
    updatedAt: nc.updatedAt.toISOString(),
  }));

  return <NoConformidadesClient items={items} isAdmin={isAdmin} />;
}
