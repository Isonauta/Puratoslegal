import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import MadurezClient from "./MadurezClient";

export const dynamic = "force-dynamic";

export default async function MadurezPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const [rawItems, rawEvaluaciones] = await Promise.all([
    prisma.maturityItem.findMany({
      include: { criterios: { orderBy: { paso: "asc" } } },
      orderBy: [{ nivel: "asc" }, { orden: "asc" }],
    }),
    prisma.maturityEvaluacion.findMany({ orderBy: [{ fecha: "desc" }] }),
  ]);

  const evaluaciones = rawEvaluaciones.map((e) => ({
    ...e,
    fecha: e.fecha.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  const asIsId = evaluaciones.find((e) => e.tipo === "AS_IS")?.id ?? null;
  const toBeId = evaluaciones.find((e) => e.tipo === "TO_BE")?.id ?? null;

  const [asIsRespuestas, toBeRespuestas] = await Promise.all([
    asIsId ? prisma.maturityRespuesta.findMany({ where: { evaluacionId: asIsId } }) : Promise.resolve([]),
    toBeId ? prisma.maturityRespuesta.findMany({ where: { evaluacionId: toBeId } }) : Promise.resolve([]),
  ]);

  const items = rawItems.map((it) => ({
    ...it,
    createdAt: it.createdAt.toISOString(),
    updatedAt: it.updatedAt.toISOString(),
    criterios: it.criterios.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
  }));

  const serializeRespuestas = (rs: typeof asIsRespuestas) =>
    rs.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }));

  return (
    <MadurezClient
      items={items}
      evaluaciones={evaluaciones}
      initialAsIsId={asIsId}
      initialToBeId={toBeId}
      initialAsIsRespuestas={serializeRespuestas(asIsRespuestas)}
      initialToBeRespuestas={serializeRespuestas(toBeRespuestas)}
      isAdmin={isAdmin}
      userName={session?.name ?? session?.email ?? null}
    />
  );
}
