import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tipo = req.nextUrl.searchParams.get("tipo");

  const evaluaciones = await prisma.maturityEvaluacion.findMany({
    where: tipo ? { tipo: tipo as "AS_IS" | "TO_BE" } : undefined,
    orderBy: [{ fecha: "desc" }],
  });
  return NextResponse.json(evaluaciones);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { tipo, planta, evaluador, comentario, clonarDesdeId } = body;

  if (tipo !== "AS_IS" && tipo !== "TO_BE") {
    return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
  }

  const evaluacion = await prisma.maturityEvaluacion.create({
    data: {
      tipo,
      planta: planta ?? null,
      evaluador: evaluador ?? null,
      comentario: comentario ?? null,
      createdBy: session.email ?? null,
    },
  });

  // Continuidad: la nueva evaluación parte con las respuestas de la última
  // evaluación del mismo tipo (si existe), para que crear un nuevo snapshot
  // en el tiempo no obligue a re-contestar los 120 criterios desde cero.
  if (clonarDesdeId) {
    const previas = await prisma.maturityRespuesta.findMany({ where: { evaluacionId: clonarDesdeId } });
    if (previas.length > 0) {
      await prisma.maturityRespuesta.createMany({
        data: previas.map((r) => ({
          evaluacionId: evaluacion.id,
          criterioId: r.criterioId,
          itemId: r.itemId,
          valor: r.valor,
          observaciones: r.observaciones,
          updatedBy: session.email ?? null,
        })),
      });
    }
  }

  return NextResponse.json(evaluacion, { status: 201 });
}
