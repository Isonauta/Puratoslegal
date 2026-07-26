import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { deleteStorageObject } from "@/lib/supabaseStorageServer";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "solo un admin puede borrar" }, { status: 403 });

  const { id } = await params;
  const documento = await prisma.documento.findUnique({ where: { id } });
  if (!documento) return NextResponse.json({ error: "no encontrado" }, { status: 404 });

  if (documento.storagePath) {
    await deleteStorageObject(documento.storagePath);
  }
  await prisma.documento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
