import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const indicadorId = req.nextUrl.searchParams.get("indicadorId");
  const items = await prisma.planAccionIndicador.findMany({
    where: indicadorId ? { indicadorId } : undefined,
    orderBy: [{ createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { indicadorId, descripcion, responsable, recursos, fechaLimite } = body;

  if (!indicadorId || !descripcion) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const item = await prisma.planAccionIndicador.create({
    data: {
      indicadorId,
      descripcion,
      responsable: responsable || null,
      recursos: recursos || null,
      fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
      createdBy: session.email ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, estado, descripcion, responsable, recursos, fechaLimite, fechaCierre } = body;
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const item = await prisma.planAccionIndicador.update({
    where: { id },
    data: {
      ...(estado !== undefined && { estado }),
      ...(descripcion !== undefined && { descripcion }),
      ...(responsable !== undefined && { responsable }),
      ...(recursos !== undefined && { recursos }),
      ...(fechaLimite !== undefined && { fechaLimite: fechaLimite ? new Date(fechaLimite) : null }),
      ...(fechaCierre !== undefined && { fechaCierre: fechaCierre ? new Date(fechaCierre) : null }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await prisma.planAccionIndicador.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
