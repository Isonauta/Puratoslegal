import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { deleteStorageObject } from "@/lib/supabaseStorageServer";
import type { StorageProvider } from "@/generated/prisma/enums";

const VALID_PROVIDERS: StorageProvider[] = ["SHAREPOINT", "GOOGLE_DRIVE"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "no autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {};

  if (body.nombre?.trim()) data.nombre = body.nombre.trim();
  if (body.descripcion !== undefined) data.descripcion = body.descripcion?.trim() || null;
  if (body.linkUrl !== undefined) data.linkUrl = body.linkUrl?.trim() || null;
  if (body.linkProvider !== undefined) {
    data.linkProvider = body.linkProvider && VALID_PROVIDERS.includes(body.linkProvider) ? body.linkProvider : null;
  }

  const documento = await prisma.documento.update({ where: { id }, data });
  return NextResponse.json({ ok: true, documento });
}

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
