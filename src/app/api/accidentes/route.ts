import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const anio = req.nextUrl.searchParams.get("anio");
  const stats = await prisma.accidenteStat.findMany({
    where: anio ? { anio: parseInt(anio) } : undefined,
    orderBy: [{ anio: "desc" }, { mes: "desc" }, { area: "asc" }],
  });
  return NextResponse.json(stats);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { anio, mes, area, trabajadores, horasTrabajadas, accidentesConTP, accidentesSinTP, diasPerdidos } = body;

  if (!anio || !mes || !area) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const stat = await prisma.accidenteStat.upsert({
    where: { anio_mes_area: { anio, mes, area } },
    create: { anio, mes, area, trabajadores: trabajadores ?? 0, horasTrabajadas: horasTrabajadas ?? 0, accidentesConTP: accidentesConTP ?? 0, accidentesSinTP: accidentesSinTP ?? 0, diasPerdidos: diasPerdidos ?? 0 },
    update: { trabajadores: trabajadores ?? 0, horasTrabajadas: horasTrabajadas ?? 0, accidentesConTP: accidentesConTP ?? 0, accidentesSinTP: accidentesSinTP ?? 0, diasPerdidos: diasPerdidos ?? 0 },
  });
  return NextResponse.json(stat);
}
