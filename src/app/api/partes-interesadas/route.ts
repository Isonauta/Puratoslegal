import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const items = await prisma.parteInteresada.findMany({ orderBy: [{ createdAt: "asc" }] });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { nombre, poder, impacto, necesidades, expectativas, mecanismoSeguimiento, responsable } = body;

  if (!nombre || !poder || !impacto) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const item = await prisma.parteInteresada.create({
    data: {
      nombre, poder, impacto,
      necesidades: necesidades ?? null,
      expectativas: expectativas ?? null,
      mecanismoSeguimiento: mecanismoSeguimiento ?? null,
      responsable: responsable ?? null,
      createdBy: session.email ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, nombre, poder, impacto, necesidades, expectativas, mecanismoSeguimiento, responsable } = body;
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const item = await prisma.parteInteresada.update({
    where: { id },
    data: {
      ...(nombre !== undefined && { nombre }),
      ...(poder !== undefined && { poder }),
      ...(impacto !== undefined && { impacto }),
      ...(necesidades !== undefined && { necesidades }),
      ...(expectativas !== undefined && { expectativas }),
      ...(mecanismoSeguimiento !== undefined && { mecanismoSeguimiento }),
      ...(responsable !== undefined && { responsable }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await prisma.parteInteresada.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
