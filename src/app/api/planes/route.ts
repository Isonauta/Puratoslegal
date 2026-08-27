import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const programa = req.nextUrl.searchParams.get("programa");
  const actividades = await prisma.planActividad.findMany({
    where: programa ? { programa } : undefined,
    orderBy: [{ programa: "asc" }, { codigoExterno: "asc" }],
  });
  return NextResponse.json(actividades);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, estado, avance, comentario } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const updated = await prisma.planActividad.update({
    where: { id },
    data: {
      ...(estado !== undefined && { estado }),
      ...(avance !== undefined && { avance }),
      ...(comentario !== undefined && { comentario }),
    },
  });
  return NextResponse.json(updated);
}
