import "dotenv/config";
import { prisma } from "../../src/lib/db";

const NUMS = [177,178,179,180,181,182,183,184,185,186];
const URL = "https://1drv.ms/f/c/9a2fe40cf9294a78/IgBvFfZ0IuZYTIAbAEOakXGQAUIxC2F7vaT3yYfHemob864?e=n7V3HU";

async function main() {
  const updated = await prisma.legalRequirement.updateMany({
    where: { numero: { in: NUMS } },
    data: { responsable: "Benjamín Henriquez", cumple: "SI" },
  });
  console.log("Updated: " + updated.count);

  const reqs = await prisma.legalRequirement.findMany({
    where: { numero: { in: NUMS } },
    select: { id: true, numero: true },
  });

  for (const req of reqs) {
    const template = await prisma.evidenceTemplate.create({
      data: { codigoSugerido: "R-" + req.numero + "-DIA", nombre: "DIA", tipoEvidencia: "DOCUMENTO" },
    });
    await prisma.evidenceLink.create({
      data: { legalRequirementId: req.id, evidenceTemplateId: template.id },
    });
    await prisma.evidenceFile.create({
      data: { evidenceTemplateId: template.id, webUrl: URL, provider: "SHAREPOINT", status: "VIGENTE", fileName: "DIA", externalId: "DIA-" + req.numero },
    });
    console.log("N" + req.numero + " ok");
  }
  console.log("Listo.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
