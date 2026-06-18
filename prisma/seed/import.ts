import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import { prisma } from "../../src/lib/db";
import {
  normalizeAmbito,
  normalizeCumple,
  parseEvidenceCodes,
  parseNumeroList,
} from "./parse";
const DATA_DIR = join(__dirname, "../../data");

function loadSheet(file: string, sheet: string): unknown[][] {
  const buf = readFileSync(join(DATA_DIR, file));
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[sheet];
  if (!ws) throw new Error(`Sheet "${sheet}" not found in ${file}`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, defaultValue: null }) as unknown[][];
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

async function importLegalRequirements() {
  const rows = loadSheet("d3808cb1-R11002_Matriz_Legal_v09_06_2026.xlsx", "Matriz Legal");
  // Header lives at row index 8 (0-based) = row 9 in the spreadsheet; data starts at index 9.
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
  console.log(`LegalRequirement: ${count} filas importadas`);
}

async function importEvidenceTemplates() {
  const rows = loadSheet(
    "0a922f42-Evidencias_Generables_SIG_Puratos_COMPLETO_1.xlsx",
    "Evidencias Generables",
  );
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
  console.log(`EvidenceTemplate: ${count} filas importadas`);
  return linkPairs;
}

async function importPermits() {
  const rows = loadSheet(
    "1f07c71d-Permisos_Autorizaciones_Puratos_2026.xlsx",
    "Permisos y Autorizaciones",
  );
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
  console.log(`Permit: ${count} filas importadas`);
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
  console.log(`EvidenceLink (vía "N° Matriz"): ${linked} creados, ${skipped} omitidos (sin match)`);
}

// Also link using the Matriz Legal "Verificador de Cumplimiento" free-text
// column, which embeds evidence codes the other direction.
async function linkEvidenceFromVerifier() {
  const rows = loadSheet("d3808cb1-R11002_Matriz_Legal_v09_06_2026.xlsx", "Matriz Legal");
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
  console.log(`EvidenceLink (vía "Verificador de Cumplimiento"): ${linked} creados`);
}

async function importActionPlans() {
  const rows = loadSheet("d3808cb1-R11002_Matriz_Legal_v09_06_2026.xlsx", "Plan de acción");
  let count = 0;
  let matched = 0;
  for (const row of rows.slice(5)) {
    const titulo = str(row[3]);
    const accionCorrectiva = str(row[10]);
    if (!titulo || !accionCorrectiva) continue;

    const tipoDocumento = str(row[1]);
    const documentoNumero = str(row[2]);

    // Best-effort match: same tipoDocumento + documentoNumero in the current matrix.
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
  console.log(`ActionPlan: ${count} filas importadas (${matched} vinculadas a un requisito vigente)`);
}

async function main() {
  await importLegalRequirements();
  const linkPairs = await importEvidenceTemplates();
  await importPermits();
  await linkEvidenceToRequirements(linkPairs);
  await linkEvidenceFromVerifier();
  await importActionPlans();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
