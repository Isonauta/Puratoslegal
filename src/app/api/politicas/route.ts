import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const politicas = await prisma.politica.findMany({
    where: { publicado: true },
    orderBy: { orden: "asc" },
  });
  return NextResponse.json(politicas);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { titulo, tipo, contenido, pdfUrl, orden } = await req.json();
  if (!titulo?.trim() || !tipo?.trim())
    return NextResponse.json({ error: "Título y tipo son obligatorios" }, { status: 400 });

  const p = await prisma.politica.create({
    data: { titulo: titulo.trim(), tipo: tipo.trim(), contenido: contenido?.trim() || null, pdfUrl: pdfUrl || null, orden: orden ?? 0 },
  });
  return NextResponse.json(p, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const p = await prisma.politica.update({ where: { id }, data });
  return NextResponse.json(p);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await prisma.politica.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
