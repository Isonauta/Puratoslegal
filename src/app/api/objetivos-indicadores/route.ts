import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const programa = req.nextUrl.searchParams.get("programa");
  const anio = req.nextUrl.searchParams.get("anio");

  const items = await prisma.objetivoIndicador.findMany({
    where: {
      ...(programa ? { programa } : {}),
      ...(anio ? { anio: parseInt(anio) } : {}),
    },
    orderBy: [{ programa: "asc" }, { numero: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { programa, clausula, objetivo, indicador, unidad, meta, frecuencia, responsable, area, anio, comentario } = body;

  if (!objetivo || !indicador || meta === undefined || !anio) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const item = await prisma.objetivoIndicador.create({
    data: {
      programa: programa ?? "SST",
      clausula: clausula ?? null,
      objetivo,
      indicador,
      unidad: unidad ?? "%",
      meta: parseFloat(meta),
      frecuencia: frecuencia ?? "Mensual",
      responsable: responsable ?? null,
      area: area ?? null,
      anio: parseInt(anio),
      comentario: comentario ?? null,
      createdBy: session.email ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, valorActual, estado, comentario, responsable, meta, clausula } = body;

  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const item = await prisma.objetivoIndicador.update({
    where: { id },
    data: {
      ...(valorActual !== undefined && { valorActual: parseFloat(valorActual) }),
      ...(estado !== undefined && { estado }),
      ...(comentario !== undefined && { comentario }),
      ...(responsable !== undefined && { responsable }),
      ...(meta !== undefined && { meta: parseFloat(meta) }),
      ...(clausula !== undefined && { clausula }),
    },
  });
  return NextResponse.json(item);
}
