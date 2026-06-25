import * as XLSX from "xlsx";
import { prisma } from "../../src/lib/db";
import {
  normalizeAmbito,
  normalizeCumple,
  parseEvidenceCodes,
  parseNumeroList,
} from "./parse";

export type ImportBuffers = {
  matriz: Buffer;
  evidencias: Buffer;
  permisos: Buffer;
};

function loadSheet(buf: Buffer, sheet: string): unknown[][] {
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Sheet "${sheet}" not found`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as unknown[][];
}

const str = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function importLegalRequirements(matriz: Buffer) {
  const rows = loadSheet(matriz, "Matriz Legal");
  let count = 0;
  for (const row of rows.slice(8)) {
    const numero = num(row[1]);
    if (numero === null) continue;

    await prisma.legalRequirement.upsert({
      where: { numero },
      create: {
        numero,
        tipoRequisito: str(row[2]) ?? "Legal",
        tipoDocumento: str(row[3]) ?? "Sin especificar",
        documentoNumero: str(row[4]),
        titulo: str(row[5]) ?? "(sin título)",
        anioPublicacion: num(row[6]),
        organismo: str(row[7]) ?? "Sin especificar",
        ambito: normalizeAmbito(str(row[8])),
        submateria: str(row[9]),
        ultimaModificacion: str(row[10]),
        articulo: str(row[11]),
        requisitoTexto: str(row[12]),
        cumple: normalizeCumple(str(row[13])),
        formaCumplimiento: str(row[15]),
        formato: str(row[16]),
        herramientas: str(row[17]),
        responsable: str(row[18]),
        estado: str(row[19]),
        riesgo: str(row[20]),
        oportunidad: str(row[21]),
      },
      update: {},
    });
    count++;
  }
  return count;
}

async function importEvidenceTemplates(evidencias: Buffer) {
  const rows = loadSheet(evidencias, "Evidencias Generables");
  let count = 0;
  const linkPairs: { codigo: string; numero: number }[] = [];

  for (const row of rows.slice(1)) {
    const codigo = str(row[4]);
    if (!codigo) continue;

    await prisma.evidenceTemplate.upsert({
      where: { codigoSugerido: codigo },
      create: {
        codigoSugerido: codigo,
        nombre: str(row[5]) ?? codigo,
        tipoEvidencia: str(row[3]) ?? "Registro / Formato",
        normativa: str(row[1]),
        submateria: str(row[2]),
        descripcion: str(row[6]),
      },
      update: {},
    });
    count++;

    for (const numero of parseNumeroList(str(row[0]))) {
      linkPairs.push({ codigo, numero });
    }
  }
  return { count, linkPairs };
}

async function importPermits(permisos: Buffer) {
  const rows = loadSheet(permisos, "Permisos y Autorizaciones");
  let count = 0;
  for (const row of rows.slice(1)) {
    const numero = num(row[0]);
    if (numero === null) continue;

    await prisma.permit.upsert({
      where: { numero },
      create: {
        numero,
        categoria: str(row[1]) ?? "Sin categoría",
        nombre: str(row[2]) ?? "(sin nombre)",
        organismoEmisor: str(row[3]) ?? "Sin especificar",
        baseLegal: str(row[4]),
        instalacionAlcance: str(row[5]),
        periodicidadVencimiento: str(row[6]),
        consecuenciaIncumplimiento: str(row[7]),
        estadoSugerido: str(row[8]),
      },
      update: {},
    });
    count++;
  }
  return count;
}

async function linkEvidenceToRequirements(linkPairs: { codigo: string; numero: number }[]) {
  let linked = 0;
  let skipped = 0;
  for (const { codigo, numero } of linkPairs) {
    const [requirement, template] = await Promise.all([
      prisma.legalRequirement.findUnique({ where: { numero } }),
      prisma.evidenceTemplate.findUnique({ where: { codigoSugerido: codigo } }),
    ]);
    if (!requirement || !template) {
      skipped++;
      continue;
    }
    await prisma.evidenceLink.upsert({
      where: {
        legalRequirementId_evidenceTemplateId: {
          legalRequirementId: requirement.id,
          evidenceTemplateId: template.id,
        },
      },
      create: { legalRequirementId: requirement.id, evidenceTemplateId: template.id },
      update: {},
    });
    linked++;
  }
  return { linked, skipped };
}

async function linkEvidenceFromVerifier(matriz: Buffer) {
  const rows = loadSheet(matriz, "Matriz Legal");
  let linked = 0;
  for (const row of rows.slice(8)) {
    const numero = num(row[1]);
    const verificador = str(row[14]);
    if (numero === null || !verificador) continue;

    const codes = parseEvidenceCodes(verificador);
    if (!codes.length) continue;

    const requirement = await prisma.legalRequirement.findUnique({ where: { numero } });
    if (!requirement) continue;

    for (const codigo of codes) {
      const template = await prisma.evidenceTemplate.findUnique({ where: { codigoSugerido: codigo } });
      if (!template) continue;
      await prisma.evidenceLink.upsert({
        where: {
          legalRequirementId_evidenceTemplateId: {
            legalRequirementId: requirement.id,
            evidenceTemplateId: template.id,
          },
        },
        create: { legalRequirementId: requirement.id, evidenceTemplateId: template.id },
        update: {},
      });
      linked++;
    }
  }
  return linked;
}

async function importActionPlans(matriz: Buffer) {
  const rows = loadSheet(matriz, "Plan de acción");
  let count = 0;
  let matched = 0;
  for (const row of rows.slice(5)) {
    const titulo = str(row[3]);
    const accionCorrectiva = str(row[10]);
    if (!titulo || !accionCorrectiva) continue;

    const tipoDocumento = str(row[1]);
    const documentoNumero = str(row[2]);

    let legalRequirementId: string | null = null;
    if (tipoDocumento && documentoNumero) {
      const candidate = await prisma.legalRequirement.findFirst({
        where: { documentoNumero, tipoDocumento: { contains: tipoDocumento.trim() } },
      });
      if (candidate) {
        legalRequirementId = candidate.id;
        matched++;
      }
    }

    const fechaRaw = row[12];
    const fechaEjecucion =
      fechaRaw instanceof Date ? fechaRaw : typeof fechaRaw === "string" && fechaRaw ? new Date(fechaRaw) : null;

    await prisma.actionPlan.create({
      data: {
        noConformidad: num(row[13]),
        legalRequirementId,
        tipoDocumento,
        documentoNumero,
        titulo,
        accionCorrectiva,
        responsable: str(row[11]),
        fechaEjecucion: fechaEjecucion && !Number.isNaN(fechaEjecucion.getTime()) ? fechaEjecucion : null,
      },
    });
    count++;
  }
  return { count, matched };
}

export async function runImport(buffers: ImportBuffers) {
  const legalRequirements = await importLegalRequirements(buffers.matriz);
  const { count: evidenceTemplates, linkPairs } = await importEvidenceTemplates(buffers.evidencias);
  const permits = await importPermits(buffers.permisos);
  const linksFromList = await linkEvidenceToRequirements(linkPairs);
  const linksFromVerifier = await linkEvidenceFromVerifier(buffers.matriz);
  const actionPlans = await importActionPlans(buffers.matriz);

  return {
    legalRequirements,
    evidenceTemplates,
    permits,
    linksFromList,
    linksFromVerifier,
    actionPlans,
  };
}
