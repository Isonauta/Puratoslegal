import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const videos = await prisma.video.findMany({
    where: { publicado: true },
    orderBy: { orden: "asc" },
  });
  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { titulo, descripcion, youtubeUrl, orden } = await req.json();
  if (!titulo?.trim() || !youtubeUrl?.trim())
    return NextResponse.json({ error: "Título y URL son obligatorios" }, { status: 400 });

  const video = await prisma.video.create({
    data: { titulo: titulo.trim(), descripcion: descripcion?.trim() || null, youtubeUrl: youtubeUrl.trim(), orden: orden ?? 0 },
  });
  return NextResponse.json(video, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const video = await prisma.video.update({ where: { id }, data });
  return NextResponse.json(video);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await prisma.video.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
