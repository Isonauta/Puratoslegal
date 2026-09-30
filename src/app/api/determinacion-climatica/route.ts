import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const items = await prisma.determinacionClimatica.findMany({ orderBy: [{ fecha: "desc" }] });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const {
    esPertinente, justificacion, expectativasPartesInteresadas,
    riesgosFisicos, riesgosTransicion, oportunidadesClimaticas, responsable,
  } = body;

  if (esPertinente === undefined || !justificacion) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const item = await prisma.determinacionClimatica.create({
    data: {
      esPertinente: !!esPertinente,
      justificacion,
      expectativasPartesInteresadas: expectativasPartesInteresadas ?? null,
      riesgosFisicos: riesgosFisicos ?? null,
      riesgosTransicion: riesgosTransicion ?? null,
      oportunidadesClimaticas: oportunidadesClimaticas ?? null,
      responsable: responsable ?? null,
      createdBy: session.email ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await prisma.determinacionClimatica.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
