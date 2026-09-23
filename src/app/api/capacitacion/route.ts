import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const programa = req.nextUrl.searchParams.get("programa");
  const estado = req.nextUrl.searchParams.get("estado");

  const items = await prisma.capacitacion.findMany({
    where: {
      ...(programa ? { programa } : {}),
      ...(estado ? { estado } : {}),
    },
    orderBy: [{ fechaPlan: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const {
    titulo, descripcion, tipo, programa, area, relator, modalidad,
    fechaPlan, duracionHrs, participantes, comentario,
  } = body;

  if (!titulo || !fechaPlan) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const item = await prisma.capacitacion.create({
    data: {
      titulo,
      descripcion: descripcion ?? null,
      tipo: tipo ?? "Inducción",
      programa: programa ?? "SST",
      area: area ?? null,
      relator: relator ?? null,
      modalidad: modalidad ?? "Presencial",
      fechaPlan: new Date(fechaPlan),
      duracionHrs: parseFloat(duracionHrs ?? "1"),
      participantes: parseInt(participantes ?? "0"),
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
  const { id, estado, fechaReal, participantes, evaluacion, evidencia, comentario, relator } = body;

  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const item = await prisma.capacitacion.update({
    where: { id },
    data: {
      ...(estado !== undefined && { estado }),
      ...(fechaReal !== undefined && { fechaReal: fechaReal ? new Date(fechaReal) : null }),
      ...(participantes !== undefined && { participantes: parseInt(participantes) }),
      ...(evaluacion !== undefined && { evaluacion: evaluacion !== "" ? parseFloat(evaluacion) : null }),
      ...(evidencia !== undefined && { evidencia }),
      ...(comentario !== undefined && { comentario }),
      ...(relator !== undefined && { relator }),
    },
  });
  return NextResponse.json(item);
}
