import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ActionPlanStatus } from "@/generated/prisma/enums";

const STATUS_VALUES: ActionPlanStatus[] = ["ABIERTO", "EN_CURSO", "CERRADO", "VENCIDO"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: {
    status?: ActionPlanStatus;
    responsable?: string | null;
    titulo?: string;
    accionCorrectiva?: string;
    fechaEjecucion?: Date | null;
  } = {};

  if (body.status !== undefined) {
    if (!STATUS_VALUES.includes(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }
  if (body.responsable !== undefined) data.responsable = body.responsable || null;
  if (body.titulo?.trim()) data.titulo = body.titulo.trim();
  if (body.accionCorrectiva?.trim()) data.accionCorrectiva = body.accionCorrectiva.trim();
  if (body.fechaEjecucion !== undefined) {
    data.fechaEjecucion = body.fechaEjecucion ? new Date(body.fechaEjecucion) : null;
  }

  const actionPlan = await prisma.actionPlan.update({ where: { id }, data });
  return NextResponse.json(actionPlan);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.actionPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
