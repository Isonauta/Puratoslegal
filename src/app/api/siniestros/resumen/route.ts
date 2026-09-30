import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const anio = req.nextUrl.searchParams.get("anio");
  const mes = req.nextUrl.searchParams.get("mes");
  const area = req.nextUrl.searchParams.get("area");

  if (!anio || !mes || !area) {
    return NextResponse.json({ error: "Faltan parámetros anio, mes o area" }, { status: 400 });
  }

  const desde = new Date(`${anio}-${mes.padStart(2, "0")}-01T00:00:00.000Z`);
  const hasta = new Date(desde);
  hasta.setUTCMonth(hasta.getUTCMonth() + 1);

  const casos = await prisma.siniestro.findMany({
    where: { area, fechaAccidente: { gte: desde, lt: hasta } },
    select: { tipoSiniestro: true, conTiempoPerdido: true, diasPerdidosImputables: true },
  });

  function resumenDe(tipo: string | null) {
    const filtrados = tipo ? casos.filter((c) => c.tipoSiniestro === tipo) : casos;
    return {
      conTP: filtrados.filter((c) => c.conTiempoPerdido).length,
      sinTP: filtrados.filter((c) => !c.conTiempoPerdido).length,
      diasPerdidos: filtrados.filter((c) => c.conTiempoPerdido).reduce((s, c) => s + c.diasPerdidosImputables, 0),
    };
  }

  return NextResponse.json({
    trabajo: resumenDe("Trabajo"),
    trayecto: resumenDe("Trayecto"),
    enfermedadProfesional: resumenDe("Enfermedad Profesional"),
    total: resumenDe(null),
    totalCasos: casos.length,
  });
}
