import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function clasificar(nivel: number): string {
  if (nivel >= 20) return "Crítico";
  if (nivel >= 12) return "Alto";
  if (nivel >= 6) return "Medio";
  return "Bajo";
}

export async function GET(req: NextRequest) {
  const programa = req.nextUrl.searchParams.get("programa");
  const tipo = req.nextUrl.searchParams.get("tipo");

  const items = await prisma.riesgoOportunidad.findMany({
    where: {
      ...(programa ? { programa } : {}),
      ...(tipo ? { tipo } : {}),
    },
    orderBy: [{ nivelRiesgo: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const {
    tipo, programa, proceso, descripcion, causas, consecuencias,
    probabilidad, impacto, tratamiento, accionControl, responsable, fechaRevision,
  } = body;

  if (!proceso || !descripcion || !probabilidad || !impacto) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const p = parseInt(probabilidad);
  const i = parseInt(impacto);
  const nivelRiesgo = p * i;

  const item = await prisma.riesgoOportunidad.create({
    data: {
      tipo: tipo ?? "Riesgo",
      programa: programa ?? "SST",
      proceso,
      descripcion,
      causas: causas ?? null,
      consecuencias: consecuencias ?? null,
      probabilidad: p,
      impacto: i,
      nivelRiesgo,
      clasificacion: clasificar(nivelRiesgo),
      tratamiento: tratamiento ?? "Mitigar",
      accionControl: accionControl ?? null,
      responsable: responsable ?? null,
      fechaRevision: fechaRevision ? new Date(fechaRevision) : null,
      createdBy: session.email ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, estado, accionControl, responsable, probabilidadR, impactoR, tratamiento } = body;

  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const item = await prisma.riesgoOportunidad.update({
    where: { id },
    data: {
      ...(estado !== undefined && { estado }),
      ...(accionControl !== undefined && { accionControl }),
      ...(responsable !== undefined && { responsable }),
      ...(tratamiento !== undefined && { tratamiento }),
      ...(probabilidadR !== undefined && { probabilidadR: parseInt(probabilidadR) }),
      ...(impactoR !== undefined && { impactoR: parseInt(impactoR) }),
    },
  });
  return NextResponse.json(item);
}
