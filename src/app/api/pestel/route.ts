import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sistema = req.nextUrl.searchParams.get("sistema");
  const categoria = req.nextUrl.searchParams.get("categoria");

  const items = await prisma.pestelFactor.findMany({
    where: {
      ...(sistema ? { sistema } : {}),
      ...(categoria ? { categoria } : {}),
    },
    orderBy: [{ categoria: "asc" }, { createdAt: "desc" }],
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
      if (!r.categoria || !r.descripcion || !r.sistema || !r.clasificacion || !r.texto) {
        return NextResponse.json({ error: "Fila de importación con campos obligatorios faltantes" }, { status: 400 });
      }
    }
    const result = await prisma.pestelFactor.createMany({
      data: rows.map((r) => ({
        categoria: String(r.categoria),
        subFactor: r.subFactor ? String(r.subFactor) : null,
        descripcion: String(r.descripcion),
        sistema: String(r.sistema),
        clasificacion: String(r.clasificacion),
        texto: String(r.texto),
        impactoTexto: r.impactoTexto ? String(r.impactoTexto) : null,
        tipoImpacto: r.tipoImpacto ? String(r.tipoImpacto) : null,
        relevancia: r.relevancia ? String(r.relevancia) : null,
        createdBy: session.email ?? null,
      })),
    });
    return NextResponse.json({ count: result.count }, { status: 201 });
  }

  const { categoria, subFactor, descripcion, sistema, clasificacion, texto, impactoTexto, tipoImpacto, relevancia } = body;

  if (!categoria || !descripcion || !sistema || !clasificacion || !texto) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const item = await prisma.pestelFactor.create({
    data: {
      categoria, subFactor: subFactor ?? null, descripcion, sistema, clasificacion, texto,
      impactoTexto: impactoTexto ?? null, tipoImpacto: tipoImpacto ?? null, relevancia: relevancia ?? null,
      createdBy: session.email ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, categoria, subFactor, descripcion, sistema, clasificacion, texto, impactoTexto, tipoImpacto, relevancia } = body;
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const item = await prisma.pestelFactor.update({
    where: { id },
    data: {
      ...(categoria !== undefined && { categoria }),
      ...(subFactor !== undefined && { subFactor }),
      ...(descripcion !== undefined && { descripcion }),
      ...(sistema !== undefined && { sistema }),
      ...(clasificacion !== undefined && { clasificacion }),
      ...(texto !== undefined && { texto }),
      ...(impactoTexto !== undefined && { impactoTexto }),
      ...(tipoImpacto !== undefined && { tipoImpacto }),
      ...(relevancia !== undefined && { relevancia }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await prisma.pestelFactor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
