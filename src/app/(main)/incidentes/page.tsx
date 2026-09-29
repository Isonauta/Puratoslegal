import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import IncidentesClient from "./IncidentesClient";

export const dynamic = "force-dynamic";

export default async function IncidentesPage() {
  const session = await getSession();
  const raw = await prisma.siniestro.findMany({
    orderBy: [{ fechaAccidente: "desc" }, { fechaInicioSintomas: "desc" }],
  });
  const items = raw.map(s => ({
    ...s,
    fechaAccidente: s.fechaAccidente?.toISOString() ?? null,
    fechaInicioSintomas: s.fechaInicioSintomas?.toISOString() ?? null,
    fechaPresentacion: s.fechaPresentacion?.toISOString() ?? null,
    fechaInicioReposo: s.fechaInicioReposo?.toISOString() ?? null,
    fechaAlta: s.fechaAlta?.toISOString() ?? null,
    fechaProximaCitacion: s.fechaProximaCitacion?.toISOString() ?? null,
  }));
  return <IncidentesClient initialItems={items} isAdmin={session?.isAdmin ?? false} />;
}
