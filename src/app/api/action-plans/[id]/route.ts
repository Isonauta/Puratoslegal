import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ActionPlanStatus } from "@/generated/prisma/enums";

const STATUS_VALUES: ActionPlanStatus[] = ["ABIERTO", "EN_CURSO", "CERRADO", "VENCIDO"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

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
  if (body.evidenciaUrl !== undefined) data.evidenciaUrl = body.evidenciaUrl || null;
  if (body.evidenciaProvider !== undefined) data.evidenciaProvider = body.evidenciaProvider || null;
  if (body.evidenciaNombre !== undefined) data.evidenciaNombre = body.evidenciaNombre || null;

  const actionPlan = await prisma.actionPlan.update({ where: { id }, data });
  return NextResponse.json(actionPlan);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.actionPlan.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
