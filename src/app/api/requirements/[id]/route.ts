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
  return NextResponse.json({ ok: true, requirement: updated });
}
