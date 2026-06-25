import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../../src/lib/db";
import { runImport } from "./importCore";

const DATA_DIR = join(__dirname, "../../data");

async function main() {
  const result = await runImport({
    matriz: readFileSync(join(DATA_DIR, "d3808cb1-R11002_Matriz_Legal_v09_06_2026.xlsx")),
    evidencias: readFileSync(join(DATA_DIR, "0a922f42-Evidencias_Generables_SIG_Puratos_COMPLETO_1.xlsx")),
    permisos: readFileSync(join(DATA_DIR, "1f07c71d-Permisos_Autorizaciones_Puratos_2026.xlsx")),
  });
  console.log(result);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
