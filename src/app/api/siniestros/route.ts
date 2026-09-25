import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const anio = req.nextUrl.searchParams.get("anio");
  const where = anio
    ? {
        OR: [
          { fechaAccidente: { gte: new Date(`${anio}-01-01`), lt: new Date(`${parseInt(anio) + 1}-01-01`) } },
          { fechaInicioSintomas: { gte: new Date(`${anio}-01-01`), lt: new Date(`${parseInt(anio) + 1}-01-01`) } },
        ],
      }
    : undefined;
  const items = await prisma.siniestro.findMany({
    where,
    orderBy: [{ fechaAccidente: "desc" }, { fechaInicioSintomas: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();

  // Bulk import: array of records
  if (Array.isArray(body)) {
    const created = await prisma.$transaction(
      body.map((r) =>
        prisma.siniestro.upsert({
          where: { idSiniestro: r.idSiniestro },
          create: r,
          update: r,
        })
      )
    );
    return NextResponse.json({ count: created.length });
  }

  const item = await prisma.siniestro.upsert({
    where: { idSiniestro: body.idSiniestro },
    create: body,
    update: body,
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  await prisma.siniestro.delete({ where: { idSiniestro: id } });
  return NextResponse.json({ ok: true });
}
