import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import IncidentesClient from "./IncidentesClient";

export const dynamic = "force-dynamic";

export default async function IncidentesPage() {
  const session = await getSession();
  const items = await prisma.siniestro.findMany({
    orderBy: [{ fechaAccidente: "desc" }, { fechaInicioSintomas: "desc" }],
  });
  return <IncidentesClient initialItems={items} isAdmin={session?.isAdmin ?? false} />;
}
