import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const docs = await prisma.documento.findMany({
    include: { revisiones: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: [{ clausula: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const {
    clausula, clausulaNombre, norma, tipo, nombre, descripcion,
    elaboradorEmail, elaboradorNombre, revisorEmail, revisorNombre,
    aprobadorEmail, aprobadorNombre, versionCode,
  } = body;

  if (!clausula || !nombre || !norma || !tipo) {
    return NextResponse.json({ error: "Campos requeridos: clausula, nombre, norma, tipo" }, { status: 400 });
  }

  const doc = await prisma.documento.create({
    data: {
      clausula, clausulaNombre: clausulaNombre ?? clausula, norma, tipo, nombre, descripcion,
      status: "BORRADOR",
      elaboradorEmail: elaboradorEmail ?? session.email,
      elaboradorNombre: elaboradorNombre ?? session.name ?? session.email,
      revisorEmail, revisorNombre,
      aprobadorEmail, aprobadorNombre,
      versionCode: versionCode ?? "v1.0",
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
