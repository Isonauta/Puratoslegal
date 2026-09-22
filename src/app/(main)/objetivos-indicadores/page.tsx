import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ObjetivosIndicadoresClient from "./ObjetivosIndicadoresClient";

export const dynamic = "force-dynamic";

export default async function ObjetivosIndicadoresPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const raw = await prisma.objetivoIndicador.findMany({
    orderBy: [{ programa: "asc" }, { numero: "asc" }],
  });

  const items = raw.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }));

  return <ObjetivosIndicadoresClient items={items} isAdmin={isAdmin} />;
}
