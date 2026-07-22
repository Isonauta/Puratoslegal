// Script: carga clasificacionSIG desde el Excel de análisis de aplicabilidad
// Uso: npx tsx prisma/seed/load-clasificacion.ts
// SEGURO: solo actualiza clasificacionSIG, no toca ningún otro campo

import "dotenv/config";
import * as XLSX from "xlsx";
import * as path from "node:path";
import { prisma } from "../../src/lib/db";

const EXCEL_PATH = path.join(
  process.env.HOME ?? "/root",
  ".claude/uploads/9dd5fd42-eb3a-525f-a825-e64815896b38/91b79de3-Analisis_Aplicabilidad_ISO14001_45001_R11002_v1.xlsx"
);

async function main() {
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets["Detalle_Clasificado"];
  const rows = (XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown) as unknown[][];

  // Header row (index 0):
  // [0]=Fila origen, [1]=N°, [14]=Clasificación preliminar
  let updated = 0;
  let notFound = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const numero = typeof row[1] === "number" ? row[1] : Number(row[1]);
    const clasificacion = typeof row[14] === "string" ? row[14].trim() : null;

    if (!numero || !clasificacion) continue;

    const result = await prisma.legalRequirement.updateMany({
      where: { numero },
      data: { clasificacionSIG: clasificacion },
    });

    if (result.count > 0) {
      updated++;
    } else {
      notFound++;
      if (notFound <= 5) console.warn(`  No encontrado en DB: N°${numero}`);
    }
  }

  console.log(`\n✓ Clasificaciones cargadas: ${updated}`);
  console.log(`  No encontrados en DB: ${notFound}`);
  console.log(`  (Los no encontrados no existen en la DB actual — sin impacto)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
