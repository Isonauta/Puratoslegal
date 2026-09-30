import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sistema = req.nextUrl.searchParams.get("sistema");
  const ambito = req.nextUrl.searchParams.get("ambito");
  const cuadrante = req.nextUrl.searchParams.get("cuadrante");

  const items = await prisma.fodaItem.findMany({
    where: {
      ...(sistema ? { sistema } : {}),
      ...(ambito ? { ambito } : {}),
      ...(cuadrante ? { cuadrante } : {}),
    },
    include: { origenPestel: true },
    orderBy: [{ cuestion: "asc" }, { createdAt: "desc" }],
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
      if (!r.sistema || !r.ambito || !r.cuestion || !r.cuadrante || !r.descripcion) {
        return NextResponse.json({ error: "Fila de importación con campos obligatorios faltantes" }, { status: 400 });
      }
    }
    const result = await prisma.fodaItem.createMany({
      data: rows.map((r) => ({
        sistema: String(r.sistema),
        ambito: String(r.ambito),
        cuestion: String(r.cuestion),
        cuadrante: String(r.cuadrante),
        descripcion: String(r.descripcion),
        tipoImpacto: r.tipoImpacto ? String(r.tipoImpacto) : null,
        origenPestelId: r.origenPestelId ? String(r.origenPestelId) : null,
        createdBy: session.email ?? null,
      })),
    });
    return NextResponse.json({ count: result.count }, { status: 201 });
  }

  const { sistema, ambito, cuestion, cuadrante, descripcion, tipoImpacto, origenPestelId } = body;

  if (!sistema || !ambito || !cuestion || !cuadrante || !descripcion) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const item = await prisma.fodaItem.create({
    data: {
      sistema, ambito, cuestion, cuadrante, descripcion,
      tipoImpacto: tipoImpacto ?? null,
      origenPestelId: origenPestelId ?? null,
      createdBy: session.email ?? null,
    },
    include: { origenPestel: true },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, sistema, ambito, cuestion, cuadrante, descripcion, tipoImpacto, origenPestelId } = body;
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const item = await prisma.fodaItem.update({
    where: { id },
    data: {
      ...(sistema !== undefined && { sistema }),
      ...(ambito !== undefined && { ambito }),
      ...(cuestion !== undefined && { cuestion }),
      ...(cuadrante !== undefined && { cuadrante }),
      ...(descripcion !== undefined && { descripcion }),
      ...(tipoImpacto !== undefined && { tipoImpacto }),
      ...(origenPestelId !== undefined && { origenPestelId: origenPestelId || null }),
    },
    include: { origenPestel: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await prisma.fodaItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
