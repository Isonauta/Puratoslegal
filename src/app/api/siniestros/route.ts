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

  // Bulk import: array of records. El área se asigna a mano en la ficha del
  // siniestro (no viene en el reporte de la Mutual) — si el import no trae
  // área, no se debe pisar la que ya se haya asignado manualmente.
  if (Array.isArray(body)) {
    const created = await prisma.$transaction(
      body.map((r) => {
        const { area: _area, ...rest } = r;
        return prisma.siniestro.upsert({
          where: { idSiniestro: r.idSiniestro },
          create: r,
          update: r.area ? r : rest,
        });
      })
    );
    return NextResponse.json({ count: created.length });
  }

  const { area: _area, ...rest } = body;
  const item = await prisma.siniestro.upsert({
    where: { idSiniestro: body.idSiniestro },
    create: body,
    update: body.area ? body : rest,
  });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { idSiniestro, area } = await req.json();
  if (!idSiniestro) return NextResponse.json({ error: "Falta idSiniestro" }, { status: 400 });

  const item = await prisma.siniestro.update({
    where: { idSiniestro },
    data: { area: area || null },
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
