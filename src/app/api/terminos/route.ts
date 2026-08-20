import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const terminos = await prisma.termino.findMany({ orderBy: { orden: "asc" } });
  return NextResponse.json(terminos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { termino, definicion, orden } = await req.json();
  if (!termino?.trim() || !definicion?.trim())
    return NextResponse.json({ error: "Término y definición son obligatorios" }, { status: 400 });

  const t = await prisma.termino.create({
    data: { termino: termino.trim(), definicion: definicion.trim(), orden: orden ?? 0 },
  });
  return NextResponse.json(t, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const t = await prisma.termino.update({ where: { id }, data });
  return NextResponse.json(t);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await prisma.termino.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
