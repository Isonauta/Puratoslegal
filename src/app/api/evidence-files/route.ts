import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { StorageProvider } from "@/generated/prisma/enums";

const VALID_PROVIDERS: StorageProvider[] = ["SHAREPOINT", "GOOGLE_DRIVE"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { evidenceTemplateId, legalRequirementId, nombre, webUrl, provider, fileName } = body;

  if (!webUrl || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "missing or invalid fields" }, { status: 400 });
  }

  let templateId = evidenceTemplateId;

  if (!templateId) {
    if (!legalRequirementId || !nombre) {
      return NextResponse.json({ error: "missing legalRequirementId or nombre" }, { status: 400 });
    }
    const requirement = await prisma.legalRequirement.findUnique({ where: { id: legalRequirementId } });
    if (!requirement) {
      return NextResponse.json({ error: "legal requirement not found" }, { status: 404 });
    }
    const template = await prisma.evidenceTemplate.create({
      data: {
        codigoSugerido: `R-${requirement.numero}-${Date.now()}`,
        nombre,
        tipoEvidencia: "Registro / Formato",
        ambito: requirement.ambito,
        evidenceLinks: { create: { legalRequirementId } },
      },
    });
    templateId = template.id;
  }

  const file = await prisma.evidenceFile.create({
    data: {
      evidenceTemplateId: templateId,
      webUrl,
      provider,
      fileName: fileName || null,
      externalId: webUrl,
      status: "VIGENTE",
    },
  });
  return NextResponse.json({ ok: true, file });
}
