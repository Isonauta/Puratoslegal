import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { CumpleEstado } from "@/generated/prisma/enums";

const VALID_CUMPLE: CumpleEstado[] = ["SI", "NO", "NO_APLICA", "PENDIENTE"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: { cumple?: CumpleEstado; responsable?: string | null; justificacionNoAplica?: string | null } = {};
  if (body.cumple !== undefined) {
    if (!VALID_CUMPLE.includes(body.cumple)) {
      return NextResponse.json({ error: "invalid cumple value" }, { status: 400 });
    }
    data.cumple = body.cumple;
  }
  if (body.responsable !== undefined) {
    data.responsable = body.responsable;
  }
  if (body.justificacionNoAplica !== undefined) {
    data.justificacionNoAplica = body.justificacionNoAplica;
  }

  const updated = await prisma.legalRequirement.update({ where: { id }, data });

  // Cuando se guarda justificación de No aplica, propagar a todos los requisitos
  // que comparten al menos una plantilla de evidencia con este.
  if (data.justificacionNoAplica && (data.cumple === "NO_APLICA" || updated.cumple === "NO_APLICA")) {
    // Obtener los evidenceTemplateIds vinculados a este requisito
    const links = await prisma.evidenceLink.findMany({
      where: { legalRequirementId: id },
      select: { evidenceTemplateId: true },
    });
    const templateIds = links.map((l) => l.evidenceTemplateId);

    if (templateIds.length > 0) {
      // Encontrar todos los otros requisitos que comparten esas plantillas
      const siblings = await prisma.evidenceLink.findMany({
        where: {
          evidenceTemplateId: { in: templateIds },
          legalRequirementId: { not: id },
        },
        select: { legalRequirementId: true },
        distinct: ["legalRequirementId"],
      });
      const siblingIds = siblings.map((s) => s.legalRequirementId);

      if (siblingIds.length > 0) {
        await prisma.legalRequirement.updateMany({
          where: { id: { in: siblingIds } },
          data: {
            cumple: "NO_APLICA",
            justificacionNoAplica: data.justificacionNoAplica,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, requirement: updated });
}
