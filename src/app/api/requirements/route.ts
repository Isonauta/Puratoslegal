import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const {
    tipoDocumento, documentoNumero, nombreLey, organismo,
    ambito, articulo, titulo, requisitoTexto, responsable,
    tipoRequisito,
  } = body;

  if (!tipoDocumento || !organismo || !ambito || !titulo) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const lastReq = await prisma.legalRequirement.findFirst({ orderBy: { numero: "desc" } });
  const nextNumero = (lastReq?.numero ?? 0) + 1;

  const requirement = await prisma.legalRequirement.create({
    data: {
      numero: nextNumero,
      tipoRequisito: tipoRequisito ?? "Legal",
      tipoDocumento,
      documentoNumero: documentoNumero || null,
      nombreLey: nombreLey || null,
      organismo,
      ambito,
      articulo: articulo || null,
      titulo,
      requisitoTexto: requisitoTexto || null,
      responsable: responsable || null,
    },
  });

  return NextResponse.json(requirement, { status: 201 });
}
