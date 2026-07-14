import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { nombre } = await req.json();
  if (typeof nombre !== "string" || !nombre.trim()) {
    return NextResponse.json({ error: "nombre requerido" }, { status: 400 });
  }
  const updated = await prisma.evidenceTemplate.update({ where: { id }, data: { nombre: nombre.trim() } });
  return NextResponse.json({ ok: true, updated });
}
