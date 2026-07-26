import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { DocNorma } from "@/generated/prisma/enums";

const VALID_NORMAS: DocNorma[] = ["ISO14001", "ISO45001", "AMBAS"];

export async function GET(req: NextRequest) {
  const clausula = req.nextUrl.searchParams.get("clausula") || undefined;
  const norma = req.nextUrl.searchParams.get("norma") || undefined;

  const documentos = await prisma.documento.findMany({
    where: {
      clausula: clausula || undefined,
      norma: norma && VALID_NORMAS.includes(norma as DocNorma) ? (norma as DocNorma) : undefined,
    },
    orderBy: [{ clausula: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ documentos });
}

// El archivo ya fue subido al bucket de Supabase Storage desde el navegador;
// acá solo guardamos los metadatos en la base de datos.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "no autenticado" }, { status: 401 });

  const body = await req.json();
  const { clausula, clausulaNombre, norma, tipo, nombre, descripcion, storagePath, publicUrl, fileName, mimeType, sizeBytes } = body;

  if (!clausula || !clausulaNombre || !VALID_NORMAS.includes(norma) || !tipo || !nombre || !storagePath || !publicUrl || !fileName) {
    return NextResponse.json({ error: "faltan campos obligatorios" }, { status: 400 });
  }

  const documento = await prisma.documento.create({
    data: {
      clausula,
      clausulaNombre,
      norma,
      tipo,
      nombre,
      descripcion: descripcion || null,
      storagePath,
      publicUrl,
      fileName,
      mimeType: mimeType || null,
      sizeBytes: typeof sizeBytes === "number" ? sizeBytes : null,
      subidoPorEmail: session.email,
      subidoPorNombre: session.name,
    },
  });
  return NextResponse.json({ ok: true, documento });
}
