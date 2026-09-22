import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const estado = req.nextUrl.searchParams.get("estado");
  const ambito = req.nextUrl.searchParams.get("ambito");

  const items = await prisma.noConformidad.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(ambito ? { ambito } : {}),
    },
    orderBy: [{ estado: "asc" }, { fechaDeteccion: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const {
    titulo, descripcion, area, ambito, tipo, origen, impacto,
    fechaDeteccion, fechaLimite, responsable, accionInmediata,
  } = body;

  if (!titulo || !descripcion || !area) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const nc = await prisma.noConformidad.create({
    data: {
      titulo,
      descripcion,
      area,
      ambito: ambito ?? "SST",
      tipo: tipo ?? "Interna",
      origen: origen ?? null,
      impacto: impacto ?? "Medio",
      fechaDeteccion: fechaDeteccion ? new Date(fechaDeteccion) : new Date(),
      fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
      responsable: responsable ?? null,
      accionInmediata: accionInmediata ?? null,
      createdBy: session.email ?? null,
    },
  });
  return NextResponse.json(nc, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const {
    id, estado, accionCorrectiva, accionPreventiva, evidencia,
    verificadoPor, responsable, fechaLimite, impacto,
  } = body;

  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const fechaCierre = estado === "Cerrada" ? new Date() : undefined;

  const nc = await prisma.noConformidad.update({
    where: { id },
    data: {
      ...(estado !== undefined && { estado }),
      ...(accionCorrectiva !== undefined && { accionCorrectiva }),
      ...(accionPreventiva !== undefined && { accionPreventiva }),
      ...(evidencia !== undefined && { evidencia }),
      ...(verificadoPor !== undefined && { verificadoPor }),
      ...(responsable !== undefined && { responsable }),
      ...(impacto !== undefined && { impacto }),
      ...(fechaLimite !== undefined && { fechaLimite: fechaLimite ? new Date(fechaLimite) : null }),
      ...(fechaCierre !== undefined && { fechaCierre }),
    },
  });
  return NextResponse.json(nc);
}
