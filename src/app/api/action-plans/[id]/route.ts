import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ActionPlanStatus } from "@/generated/prisma/enums";

const STATUS_VALUES: ActionPlanStatus[] = ["ABIERTO", "EN_CURSO", "CERRADO", "VENCIDO"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (!STATUS_VALUES.includes(body.status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const actionPlan = await prisma.actionPlan.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json(actionPlan);
}
