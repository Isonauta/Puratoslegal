import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ContextoClient from "./ContextoClient";

export const dynamic = "force-dynamic";

export default async function EstrategiaRiesgosPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const [rawRiesgos, rawPestel, rawFoda] = await Promise.all([
    prisma.riesgoOportunidad.findMany({
      include: { origenFoda: true },
      orderBy: [{ nivelRiesgo: "desc" }, { createdAt: "desc" }],
    }),
    prisma.pestelFactor.findMany({ orderBy: [{ categoria: "asc" }, { createdAt: "desc" }] }),
    prisma.fodaItem.findMany({
      include: { origenPestel: true },
      orderBy: [{ cuestion: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const riesgos = rawRiesgos.map((r) => ({
    ...r,
    fechaRevision: r.fechaRevision?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    origenFoda: r.origenFoda ? { ...r.origenFoda, createdAt: r.origenFoda.createdAt.toISOString(), updatedAt: r.origenFoda.updatedAt.toISOString() } : null,
  }));

  const pestel = rawPestel.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const foda = rawFoda.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    origenPestel: f.origenPestel ? { ...f.origenPestel, createdAt: f.origenPestel.createdAt.toISOString(), updatedAt: f.origenPestel.updatedAt.toISOString() } : null,
  }));

  return <ContextoClient riesgos={riesgos} pestel={pestel} foda={foda} isAdmin={isAdmin} />;
}
