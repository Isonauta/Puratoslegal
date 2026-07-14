import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { CumpleEstado } from "@/generated/prisma/enums";

const VALID_CUMPLE: CumpleEstado[] = ["SI", "NO", "NO_APLICA", "PENDIENTE"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: { cumple?: CumpleEstado; responsable?: string | null; justificacionNoAplica?: string | null; formaCumplimiento?: string | null } = {};
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
  if (body.formaCumplimiento !== undefined) {
    data.formaCumplimiento = body.formaCumplimiento;
  }

  const updated = await prisma.legalRequirement.update({ where: { id }, data });

  // Propagar cambios a todos los requisitos que comparten evidencia con este
  const shouldPropagate = data.cumple !== undefined || data.justificacionNoAplica !== undefined;
  if (shouldPropagate) {
    const links = await prisma.evidenceLink.findMany({
      where: { legalRequirementId: id },
      select: { evidenceTemplateId: true },
    });
    const templateIds = links.map((l) => l.evidenceTemplateId);

    if (templateIds.length > 0) {
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
        const propagate: { cumple?: CumpleEstado; justificacionNoAplica?: string | null } = {};
        if (data.cumple !== undefined) propagate.cumple = data.cumple;
        if (data.justificacionNoAplica !== undefined) propagate.justificacionNoAplica = data.justificacionNoAplica;
        // Si cambia de NO_APLICA a otro estado, limpiar la justificación en los hermanos también
        if (data.cumple !== undefined && data.cumple !== "NO_APLICA") propagate.justificacionNoAplica = null;

        await prisma.legalRequirement.updateMany({
          where: { id: { in: siblingIds } },
          data: propagate,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, requirement: updated });
}
