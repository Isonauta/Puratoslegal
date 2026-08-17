import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const ats = await prisma.aTS.findUnique({
    where: { id },
    include: { steps: true, workers: true },
  });

  if (!ats) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(ats);
}
