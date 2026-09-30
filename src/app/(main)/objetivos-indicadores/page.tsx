import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ObjetivosIndicadoresClient from "./ObjetivosIndicadoresClient";

export const dynamic = "force-dynamic";

export default async function ObjetivosIndicadoresPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const raw = await prisma.objetivoIndicador.findMany({
    include: { planAccion: { orderBy: { createdAt: "desc" } } },
    orderBy: [{ programa: "asc" }, { numero: "asc" }],
  });

  const items = raw.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    planAccion: o.planAccion.map((p) => ({
      ...p,
      fechaLimite: p.fechaLimite?.toISOString() ?? null,
      fechaCierre: p.fechaCierre?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  }));

  return <ObjetivosIndicadoresClient items={items} isAdmin={isAdmin} />;
}
