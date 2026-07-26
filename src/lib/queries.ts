import { prisma } from "@/lib/db";
import type { Ambito, CumpleEstado } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export type ComplianceByAmbito = {
  ambito: Ambito;
  total: number;
  cumple: number;
  noCumple: number;
  noAplica: number;
  pendiente: number;
  porcentaje: number;
};

export async function getComplianceByAmbito(): Promise<ComplianceByAmbito[]> {
  const groups = await prisma.legalRequirement.groupBy({
    by: ["ambito", "cumple"],
    _count: true,
  });

  const byAmbito = new Map<Ambito, ComplianceByAmbito>();
  for (const g of groups) {
    const entry =
      byAmbito.get(g.ambito) ??
      ({ ambito: g.ambito, total: 0, cumple: 0, noCumple: 0, noAplica: 0, pendiente: 0, porcentaje: 0 } as ComplianceByAmbito);

    entry.total += g._count;
    if (g.cumple === "SI") entry.cumple += g._count;
    else if (g.cumple === "NO") entry.noCumple += g._count;
    else if (g.cumple === "NO_APLICA") entry.noAplica += g._count;
    else entry.pendiente += g._count;

    byAmbito.set(g.ambito, entry);
  }

  for (const entry of byAmbito.values()) {
    const aplicable = entry.total - entry.noAplica;
    entry.porcentaje = aplicable > 0 ? Math.round((entry.cumple / aplicable) * 1000) / 10 : 100;
  }

  return [...byAmbito.values()].sort((a, b) => b.total - a.total);
}

export async function getOverallCompliance() {
  const byAmbito = await getComplianceByAmbito();
  const total = byAmbito.reduce((acc, a) => acc + a.total, 0);
  const cumple = byAmbito.reduce((acc, a) => acc + a.cumple, 0);
  const noCumple = byAmbito.reduce((acc, a) => acc + a.noCumple, 0);
  const noAplica = byAmbito.reduce((acc, a) => acc + a.noAplica, 0);
  const pendiente = byAmbito.reduce((acc, a) => acc + a.pendiente, 0);
  const aplicable = total - noAplica;
  const porcentaje = aplicable > 0 ? Math.round((cumple / aplicable) * 1000) / 10 : 100;
  return { total, cumple, noCumple, noAplica, pendiente, porcentaje };
}

export async function getOpenActionPlans() {
  return prisma.actionPlan.findMany({
    where: { status: { not: "CERRADO" } },
    orderBy: { fechaEjecucion: "asc" },
    include: { legalRequirement: { select: { numero: true, ambito: true, titulo: true } } },
  });
}

export async function getNonCompliantRequirements(limit = 10) {
  return prisma.legalRequirement.findMany({
    where: { cumple: "NO" },
    orderBy: { numero: "asc" },
    take: limit,
    select: { id: true, numero: true, titulo: true, ambito: true, organismo: true, responsable: true },
  });
}

export async function getEvidenceStatusSummary() {
  const groups = await prisma.evidenceTemplate.groupBy({ by: ["tipoEvidencia"], _count: true });
  const filesByStatus = await prisma.evidenceFile.groupBy({ by: ["status"], _count: true });
  const totalTemplates = await prisma.evidenceTemplate.count();
  const templatesWithFile = await prisma.evidenceTemplate.count({ where: { files: { some: {} } } });
  return { byTipo: groups, filesByStatus, totalTemplates, templatesWithFile };
}

export type RequirementFilters = {
  ambito?: Ambito;
  cumple?: CumpleEstado;
  evidencia?: "con" | "sin";
  alcance?: "revisar" | "fuera";
  ley?: string;
  q?: string;
};

export async function getLeyesDisponibles() {
  const rows = await prisma.legalRequirement.findMany({
    select: { tipoDocumento: true, documentoNumero: true, titulo: true },
    orderBy: [{ tipoDocumento: "asc" }, { documentoNumero: "asc" }],
  });
  const seen = new Set<string>();
  const result: { key: string; label: string }[] = [];
  for (const r of rows) {
    const key = `${r.tipoDocumento}|${r.documentoNumero ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const label = r.documentoNumero
      ? `${r.tipoDocumento} N°${r.documentoNumero}`
      : r.tipoDocumento;
    result.push({ key, label });
  }
  return result;
}

export async function getAllRequirements(filters: RequirementFilters = {}) {
  const where: Prisma.LegalRequirementWhereInput = {};
  if (filters.ambito) where.ambito = filters.ambito;
  if (filters.cumple) where.cumple = filters.cumple;
  if (filters.evidencia === "con") where.evidenceLinks = { some: {} };
  if (filters.evidencia === "sin") where.evidenceLinks = { none: {} };
  if (filters.alcance === "revisar") where.clasificacionSIG = { startsWith: "Revisar" };
  if (filters.alcance === "fuera") where.fueraAlcanceSIG = true;
  if (filters.ley) {
    const [tipo, numero] = filters.ley.split("|");
    where.tipoDocumento = tipo;
    where.documentoNumero = numero || null;
  }
  if (filters.q) {
    const pattern = `%${filters.q}%`;
    const matches = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "LegalRequirement"
      WHERE titulo ILIKE ${pattern}
         OR articulo ILIKE ${pattern}
         OR "requisitoTexto" ILIKE ${pattern}
         OR organismo ILIKE ${pattern}
    `;
    where.id = { in: matches.map((m) => m.id) };
  }

  return prisma.legalRequirement.findMany({
    where,
    orderBy: { numero: "asc" },
    include: {
      evidenceLinks: {
        include: { evidenceTemplate: { include: { files: { orderBy: { createdAt: "desc" } } } } },
      },
    },
  });
}

export async function getAllActionPlans() {
  return prisma.actionPlan.findMany({
    orderBy: [{ status: "asc" }, { fechaEjecucion: "asc" }],
    include: { legalRequirement: { select: { numero: true, ambito: true, titulo: true } } },
  });
}

export async function getTasksByResponsable(responsable: string) {
  return prisma.legalRequirement.findMany({
    where: {
      responsable,
      OR: [
        { cumple: "PENDIENTE" },
        { cumple: "NO" },
        { evidenceLinks: { some: { evidenceTemplate: { files: { some: { status: { in: ["POR_GENERAR", "ACTUALIZAR", "VENCIDO"] } } } } } } },
        { evidenceLinks: { none: {} } },
      ],
    },
    orderBy: [{ cumple: "asc" }, { numero: "asc" }],
    include: {
      evidenceLinks: {
        include: { evidenceTemplate: { include: { files: { orderBy: { createdAt: "desc" } } } } },
      },
    },
  });
}

const KNOWN_RESPONSABLES = ["Sebastián Corrotea", "Benjamín Henriquez"];

const REQ_SUMMARY_SELECT = { id: true, numero: true, titulo: true, ambito: true, cumple: true } as const;

export async function getResponsablesSummary() {
  const results = await Promise.all(
    KNOWN_RESPONSABLES.map(async (resp) => {
      const [total, cumpleConEvidencia, itemsSinEvidencia, itemsPendiente, itemsNoCumple] = await Promise.all([
        prisma.legalRequirement.count({ where: { responsable: resp } }),
        prisma.legalRequirement.count({ where: { responsable: resp, cumple: "SI", evidenceLinks: { some: { evidenceTemplate: { files: { some: {} } } } } } }),
        prisma.legalRequirement.findMany({ where: { responsable: resp, cumple: "SI", evidenceLinks: { none: {} } }, select: REQ_SUMMARY_SELECT, orderBy: { numero: "asc" } }),
        prisma.legalRequirement.findMany({ where: { responsable: resp, cumple: "PENDIENTE" }, select: REQ_SUMMARY_SELECT, orderBy: { numero: "asc" } }),
        prisma.legalRequirement.findMany({ where: { responsable: resp, cumple: "NO" }, select: REQ_SUMMARY_SELECT, orderBy: { numero: "asc" } }),
      ]);
      return {
        responsable: resp,
        total,
        cumple: cumpleConEvidencia,
        cumpleSinEvidencia: itemsSinEvidencia.length,
        pendiente: itemsPendiente.length,
        noCumple: itemsNoCumple.length,
        itemsSinEvidencia,
        itemsPendiente,
        itemsNoCumple,
      };
    })
  );
  return results;
}

export async function getRequirementsNeedingActionPlan() {
  // Requisitos que no cumplen o que cumplen sin evidencia, y aún no tienen plan abierto
  const [noCumple, sinEvidencia] = await Promise.all([
    prisma.legalRequirement.findMany({
      where: { cumple: "NO" },
      select: { id: true, numero: true, titulo: true, ambito: true, responsable: true, cumple: true },
      orderBy: { numero: "asc" },
    }),
    prisma.legalRequirement.findMany({
      where: { cumple: "SI", evidenceLinks: { none: {} } },
      select: { id: true, numero: true, titulo: true, ambito: true, responsable: true, cumple: true },
      orderBy: { numero: "asc" },
    }),
  ]);
  return { noCumple, sinEvidencia };
}

export async function getPermitsNeedingAttention() {
  return prisma.permit.findMany({
    where: {
      OR: [
        { estadoSugerido: { contains: "Verificar" } },
        { estadoSugerido: { contains: "Gestionar" } },
        { estadoSugerido: { contains: "Solicitar" } },
      ],
    },
    orderBy: { numero: "asc" },
  });
}

export async function getAllDocumentos() {
  return prisma.documento.findMany({
    orderBy: [{ clausula: "asc" }, { createdAt: "desc" }],
  });
}
