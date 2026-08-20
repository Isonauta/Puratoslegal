import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const noticias = await prisma.noticia.findMany({
    where: { publicado: true },
    orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(noticias);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { titulo, contenido, categoria, destacado } = await req.json();
  if (!titulo?.trim() || !contenido?.trim()) {
    return NextResponse.json({ error: "Título y contenido son obligatorios" }, { status: 400 });
  }

  const noticia = await prisma.noticia.create({
    data: {
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      categoria: categoria?.trim() || null,
      destacado: destacado === true,
      autorNombre: session.name ?? session.email,
      autorEmail: session.email,
    },
  });

  return NextResponse.json(noticia, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const noticia = await prisma.noticia.update({ where: { id }, data });
  return NextResponse.json(noticia);
}
