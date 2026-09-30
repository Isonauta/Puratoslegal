import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import GestionCambioClient from "./GestionCambioClient";

export const dynamic = "force-dynamic";

export default async function GestionCambioPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const raw = await prisma.gestionCambio.findMany({
    include: { historial: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ createdAt: "desc" }],
  });

  const items = raw.map((c) => ({
    ...c,
    fechaSolicitud: c.fechaSolicitud.toISOString(),
    fechaImplementacionPrevista: c.fechaImplementacionPrevista?.toISOString() ?? null,
    fechaEvaluacion: c.fechaEvaluacion?.toISOString() ?? null,
    fechaAutorizacion: c.fechaAutorizacion?.toISOString() ?? null,
    fechaImplementacion: c.fechaImplementacion?.toISOString() ?? null,
    fechaValidacion: c.fechaValidacion?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    historial: c.historial.map((h) => ({ ...h, createdAt: h.createdAt.toISOString() })),
  }));

  return <GestionCambioClient items={items} isAdmin={isAdmin} userEmail={session?.email ?? null} />;
}
