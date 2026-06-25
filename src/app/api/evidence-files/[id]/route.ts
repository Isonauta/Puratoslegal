import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { EvidenceFileStatus } from "@/generated/prisma/enums";

const VALID_STATUS: EvidenceFileStatus[] = ["POR_GENERAR", "EN_REVISION", "VIGENTE", "VENCIDO", "ACTUALIZAR"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: { webUrl?: string; status?: EvidenceFileStatus } = {};
  if (body.webUrl !== undefined) data.webUrl = body.webUrl;
  if (body.status !== undefined) {
    if (!VALID_STATUS.includes(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    data.status = body.status;
  }

  const file = await prisma.evidenceFile.update({ where: { id }, data });
  return NextResponse.json({ ok: true, file });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.evidenceFile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
