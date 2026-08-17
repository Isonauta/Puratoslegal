import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { DocNorma, StorageProvider } from "@/generated/prisma/enums";

const VALID_NORMAS: DocNorma[] = ["ISO14001", "ISO45001", "AMBAS"];
const VALID_PROVIDERS: StorageProvider[] = ["SHAREPOINT", "GOOGLE_DRIVE"];

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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "no autenticado" }, { status: 401 });

  const body = await req.json();
  const { clausula, clausulaNombre, norma, tipo, nombre, descripcion, storagePath, publicUrl, fileName, mimeType, sizeBytes, linkUrl, linkProvider } = body;

  if (!clausula || !clausulaNombre || !VALID_NORMAS.includes(norma) || !tipo || !nombre) {
    return NextResponse.json({ error: "faltan campos obligatorios" }, { status: 400 });
  }

  const isExternalLink = !!linkUrl;
  const isFileUpload = !!storagePath && !!publicUrl && !!fileName;

  if (!isExternalLink && !isFileUpload) {
    return NextResponse.json({ error: "debe proporcionar un archivo o un enlace externo" }, { status: 400 });
  }

  if (isExternalLink && linkProvider && !VALID_PROVIDERS.includes(linkProvider)) {
    return NextResponse.json({ error: "proveedor inválido" }, { status: 400 });
  }

  const documento = await prisma.documento.create({
    data: {
      clausula,
      clausulaNombre,
      norma,
      tipo,
      nombre,
      descripcion: descripcion || null,
      storagePath: isFileUpload ? storagePath : null,
      publicUrl: isFileUpload ? publicUrl : null,
      fileName: isFileUpload ? fileName : null,
      mimeType: mimeType || null,
      sizeBytes: typeof sizeBytes === "number" ? sizeBytes : null,
      linkUrl: isExternalLink ? linkUrl : null,
      linkProvider: isExternalLink && linkProvider ? linkProvider : null,
      subidoPorEmail: session.email,
      subidoPorNombre: session.name,
    },
  });
  return NextResponse.json({ ok: true, documento });
}
