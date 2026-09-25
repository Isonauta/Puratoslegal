/**
 * Importa el archivo Excel de siniestros directo a Supabase via Prisma.
 * Uso: node scripts/seed-siniestros.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import XLSX from "xlsx";
import { PrismaClient } from "../src/generated/prisma/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

function parseFecha(val) {
  if (!val || val === "---" || String(val).trim() === "") return null;
  const s = String(val).trim();
  const parts = s.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00.000Z`);
  }
  return null;
}

async function main() {
  const filePath = join(__dirname, "../data/siniestros.xlsx");
  const buf = readFileSync(filePath);
  const wb = XLSX.read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  const records = rows
    .filter((r) => r["ID del siniestro"])
    .map((r) => ({
      idSiniestro: String(r["ID del siniestro"]),
      nombreUsuario: String(r["Nombre de usuario"] ?? ""),
      rutUsuario: String(r["Rut usuario"] ?? ""),
      tipoSiniestro: String(r["Tipo de siniestro"] ?? "Trabajo"),
      calificacion: String(r["Calificación"] ?? "Sin cobertura"),
      conTiempoPerdido: String(r["Con o sin tiempo perdido"]) === "CTP",
      reposoActivo: ["sí", "si"].includes(String(r["Reposo activo"]).toLowerCase()),
      diasReposo: Number(r["Días de reposo"] ?? 0),
      diasPerdidosImputables: Number(r["Días perdidos imputables"] ?? 0),
      fechaAccidente: parseFecha(r["Fecha del accidente"]),
      fechaInicioSintomas: parseFecha(r["Fecha de inicio de síntomas"]),
      fechaPresentacion: parseFecha(r["Fecha de presentación"]),
      fechaInicioReposo: parseFecha(r["Fecha de inicio del reposo"]),
      fechaAlta: parseFecha(r["Fecha de alta"]),
      fechaProximaCitacion: parseFecha(r["Fecha de próxima citación"]),
      centroAsistencial: String(r["Centro asistencial de tratamiento"] ?? "") || null,
      parteDelCuerpo: String(r["Parte del cuerpo lesionada"] ?? "") || null,
      mecanismoAccidente: String(r["Mecanismo del accidente"] ?? "") || null,
    }));

  console.log(`Importando ${records.length} siniestros…`);

  let count = 0;
  for (const rec of records) {
    await prisma.siniestro.upsert({
      where: { idSiniestro: rec.idSiniestro },
      create: rec,
      update: rec,
    });
    count++;
    process.stdout.write(`\r  ${count}/${records.length}`);
  }

  console.log(`\n✓ ${count} registros importados.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
