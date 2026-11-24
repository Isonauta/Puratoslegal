import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const evaluacion = await prisma.maturityEvaluacion.findUnique({ where: { id } });
  if (!evaluacion) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const respuestas = await prisma.maturityRespuesta.findMany({ where: { evaluacionId: id } });

  return NextResponse.json({ evaluacion, respuestas });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  await prisma.maturityEvaluacion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
