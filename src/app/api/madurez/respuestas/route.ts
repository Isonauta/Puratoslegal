import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { evaluacionId, criterioId, itemId, valor, observaciones } = body;

  if (!evaluacionId || !criterioId || !itemId) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  if (valor !== null && valor !== 0 && valor !== 0.5 && valor !== 1) {
    return NextResponse.json({ error: "valor inválido" }, { status: 400 });
  }

  const respuesta = await prisma.maturityRespuesta.upsert({
    where: { evaluacionId_criterioId: { evaluacionId, criterioId } },
    create: {
      evaluacionId,
      criterioId,
      itemId,
      valor,
      observaciones: observaciones ?? null,
      updatedBy: session.email ?? null,
    },
    update: {
      valor,
      ...(observaciones !== undefined && { observaciones }),
      updatedBy: session.email ?? null,
    },
  });

  await prisma.maturityEvaluacion.update({ where: { id: evaluacionId }, data: { updatedAt: new Date() } });

  return NextResponse.json(respuesta);
}
