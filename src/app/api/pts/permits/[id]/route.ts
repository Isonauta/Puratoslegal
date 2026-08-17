import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const permit = await prisma.workPermit.findUnique({
    where: { id },
    include: {
      company: true,
      solicitante: true,
      supervisor: true,
      workers: true,
      atmosphereReadings: true,
      signatures: { include: { user: true } },
      statusLogs: { include: { changedBy: true }, orderBy: { createdAt: "asc" } },
      atsList: true,
    },
  });

  if (!permit) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(permit);
}
