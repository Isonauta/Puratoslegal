import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { legalRequirementId, titulo, accionCorrectiva, responsable, fechaEjecucion } = body;

  if (!titulo?.trim() || !accionCorrectiva?.trim()) {
    return NextResponse.json({ error: "título y acción correctiva requeridos" }, { status: 400 });
  }

  const plan = await prisma.actionPlan.create({
    data: {
      titulo: titulo.trim(),
      accionCorrectiva: accionCorrectiva.trim(),
      responsable: responsable || null,
      fechaEjecucion: fechaEjecucion ? new Date(fechaEjecucion) : null,
      legalRequirementId: legalRequirementId || null,
      status: "ABIERTO",
    },
  });

  return NextResponse.json({ ok: true, plan });
}
