import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sistema = req.nextUrl.searchParams.get("sistema");
  const tipo = req.nextUrl.searchParams.get("tipo");

  const items = await prisma.cameEstrategia.findMany({
    where: {
      ...(sistema ? { sistema } : {}),
      ...(tipo ? { tipo } : {}),
    },
    orderBy: [{ tipo: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();

  if (Array.isArray(body.bulk)) {
    const rows = body.bulk as Array<Record<string, unknown>>;
    for (const r of rows) {
      if (!r.tipo || !r.titulo || !r.descripcion) {
        return NextResponse.json({ error: "Fila con campos obligatorios faltantes" }, { status: 400 });
      }
    }
    const result = await prisma.cameEstrategia.createMany({
      data: rows.map((r) => ({
        sistema: r.sistema ? String(r.sistema) : "SST",
        tipo: String(r.tipo),
        titulo: String(r.titulo),
        descripcion: String(r.descripcion),
        itemsFoda: r.itemsFoda ? String(r.itemsFoda) : null,
        responsable: r.responsable ? String(r.responsable) : null,
        prioridad: r.prioridad ? String(r.prioridad) : "Media",
        createdBy: session.email ?? null,
      })),
    });
    return NextResponse.json({ count: result.count }, { status: 201 });
  }

  const { sistema, tipo, titulo, descripcion, itemsFoda, responsable, prioridad } = body;
  if (!tipo || !titulo || !descripcion) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const item = await prisma.cameEstrategia.create({
    data: {
      sistema: sistema ?? "SST",
      tipo, titulo, descripcion,
      itemsFoda: itemsFoda ?? null,
      responsable: responsable ?? null,
      prioridad: prioridad ?? "Media",
      createdBy: session.email ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, sistema, tipo, titulo, descripcion, itemsFoda, responsable, prioridad } = body;
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const item = await prisma.cameEstrategia.update({
    where: { id },
    data: {
      ...(sistema !== undefined && { sistema }),
      ...(tipo !== undefined && { tipo }),
      ...(titulo !== undefined && { titulo }),
      ...(descripcion !== undefined && { descripcion }),
      ...(itemsFoda !== undefined && { itemsFoda }),
      ...(responsable !== undefined && { responsable }),
      ...(prioridad !== undefined && { prioridad }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await prisma.cameEstrategia.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
