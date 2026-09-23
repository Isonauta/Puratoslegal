import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const programa = req.nextUrl.searchParams.get("programa");
  const estado = req.nextUrl.searchParams.get("estado");

  const items = await prisma.auditoriaInterna.findMany({
    where: {
      ...(programa ? { programa } : {}),
      ...(estado ? { estado } : {}),
    },
    orderBy: [{ fechaPlan: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { titulo, programa, tipo, alcance, auditores, auditado, fechaPlan, proximaAuditoria } = body;

  if (!titulo || !fechaPlan) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const item = await prisma.auditoriaInterna.create({
    data: {
      titulo,
      programa: programa ?? "SST",
      tipo: tipo ?? "Interna",
      alcance: alcance ?? null,
      auditores: auditores ?? null,
      auditado: auditado ?? null,
      fechaPlan: new Date(fechaPlan),
      proximaAuditoria: proximaAuditoria ? new Date(proximaAuditoria) : null,
      createdBy: session.email ?? null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const {
    id, estado, fechaReal, hallazgos, noConformidades, observaciones,
    oportunidades, conclusion, evidencia, proximaAuditoria,
  } = body;

  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const item = await prisma.auditoriaInterna.update({
    where: { id },
    data: {
      ...(estado !== undefined && { estado }),
      ...(fechaReal !== undefined && { fechaReal: fechaReal ? new Date(fechaReal) : null }),
      ...(hallazgos !== undefined && { hallazgos }),
      ...(noConformidades !== undefined && { noConformidades: parseInt(noConformidades) }),
      ...(observaciones !== undefined && { observaciones: parseInt(observaciones) }),
      ...(oportunidades !== undefined && { oportunidades: parseInt(oportunidades) }),
      ...(conclusion !== undefined && { conclusion }),
      ...(evidencia !== undefined && { evidencia }),
      ...(proximaAuditoria !== undefined && { proximaAuditoria: proximaAuditoria ? new Date(proximaAuditoria) : null }),
    },
  });
  return NextResponse.json(item);
}
