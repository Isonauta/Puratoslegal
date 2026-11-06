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
    idSiniestro: s.idSiniestro,
    nombreUsuario: s.nombreUsuario,
    rutUsuario: s.rutUsuario,
    tipoSiniestro: s.tipoSiniestro,
    calificacion: s.calificacion,
    conTiempoPerdido: s.conTiempoPerdido,
    reposoActivo: s.reposoActivo,
    diasReposo: s.diasReposo,
    diasPerdidosImputables: s.diasPerdidosImputables,
    fechaAccidente: s.fechaAccidente?.toISOString() ?? null,
    fechaInicioSintomas: s.fechaInicioSintomas?.toISOString() ?? null,
    fechaPresentacion: s.fechaPresentacion?.toISOString() ?? null,
    fechaInicioReposo: s.fechaInicioReposo?.toISOString() ?? null,
    fechaAlta: s.fechaAlta?.toISOString() ?? null,
    fechaProximaCitacion: s.fechaProximaCitacion?.toISOString() ?? null,
    centroAsistencial: s.centroAsistencial,
    parteDelCuerpo: s.parteDelCuerpo,
    mecanismoAccidente: s.mecanismoAccidente,
    area: null as string | null,
  }));
  return <IncidentesClient initialItems={items} isAdmin={session?.isAdmin ?? false} />;
}
