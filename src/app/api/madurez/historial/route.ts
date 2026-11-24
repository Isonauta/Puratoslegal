import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { overallScore, respuestaMapFor, type Item } from "@/lib/madurez";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [items, evaluaciones] = await Promise.all([
    prisma.maturityItem.findMany({ include: { criterios: true } }),
    prisma.maturityEvaluacion.findMany({ orderBy: [{ fecha: "asc" }], include: { respuestas: true } }),
  ]);

  const historial = evaluaciones.map((ev) => {
    const respuestaMap = respuestaMapFor(ev.respuestas);
    const scoreGlobal = overallScore(items as Item[], respuestaMap);
    return {
      id: ev.id,
      tipo: ev.tipo,
      fecha: ev.fecha.toISOString(),
      planta: ev.planta,
      evaluador: ev.evaluador,
      scoreGlobal,
    };
  });

  return NextResponse.json(historial);
}
