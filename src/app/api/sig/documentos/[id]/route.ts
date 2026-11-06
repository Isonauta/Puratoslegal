import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const {
    nombre, descripcion, clausula, clausulaNombre, norma, tipo, versionCode,
    linkUrl, publicUrl,
    elaboradorEmail, elaboradorNombre,
    revisorEmail, revisorNombre,
    aprobadorEmail, aprobadorNombre,
    proximaRevision,
  } = body;

  const doc = await prisma.documento.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(descripcion !== undefined && { descripcion }),
      ...(clausula !== undefined && { clausula }),
      ...(clausulaNombre !== undefined && { clausulaNombre }),
      ...(norma !== undefined && { norma }),
      ...(tipo !== undefined && { tipo }),
      ...(versionCode !== undefined && { versionCode }),
      ...(linkUrl !== undefined && { linkUrl: linkUrl || null }),
      ...(publicUrl !== undefined && { publicUrl: publicUrl || null }),
      ...(elaboradorEmail !== undefined && { elaboradorEmail }),
      ...(elaboradorNombre !== undefined && { elaboradorNombre }),
      ...(revisorEmail !== undefined && { revisorEmail }),
      ...(revisorNombre !== undefined && { revisorNombre }),
      ...(aprobadorEmail !== undefined && { aprobadorEmail }),
      ...(aprobadorNombre !== undefined && { aprobadorNombre }),
      ...(proximaRevision !== undefined && { proximaRevision: proximaRevision ? new Date(proximaRevision) : null }),
    },
    include: { revisiones: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  return NextResponse.json(doc);
}
