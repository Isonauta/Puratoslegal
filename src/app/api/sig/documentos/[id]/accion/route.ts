import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { DocStatus } from "@/generated/prisma/client";

const TRANSITIONS: Record<string, { fromStatus: DocStatus[]; toStatus: DocStatus; accion: string }> = {
  enviar_revision: { fromStatus: ["BORRADOR", "RECHAZADO"], toStatus: "EN_REVISION", accion: "ENVIADO_REVISION" },
  aprobar_revision: { fromStatus: ["EN_REVISION"], toStatus: "EN_APROBACION", accion: "APROBADO_REVISION" },
  devolver: { fromStatus: ["EN_REVISION", "EN_APROBACION"], toStatus: "BORRADOR", accion: "DEVUELTO" },
  aprobar: { fromStatus: ["EN_APROBACION"], toStatus: "VIGENTE", accion: "APROBADO" },
  rechazar: { fromStatus: ["EN_APROBACION"], toStatus: "RECHAZADO", accion: "RECHAZADO" },
};

const ROLE_STAMP: Record<string, { emailField: string; nombreField: string }> = {
  enviar_revision: { emailField: "elaboradorEmail", nombreField: "elaboradorNombre" },
  aprobar_revision: { emailField: "revisorEmail", nombreField: "revisorNombre" },
  devolver: { emailField: "revisorEmail", nombreField: "revisorNombre" },
  aprobar: { emailField: "aprobadorEmail", nombreField: "aprobadorNombre" },
  rechazar: { emailField: "aprobadorEmail", nombreField: "aprobadorNombre" },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { accion, comentario, contenido, descripcionCambios, sinCambios } = await req.json();

  const transition = TRANSITIONS[accion];
  if (!transition) return NextResponse.json({ error: "Acción inválida" }, { status: 400 });

  const doc = await prisma.documento.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

  if (!transition.fromStatus.includes(doc.status)) {
    return NextResponse.json(
      { error: `No se puede ejecutar "${accion}" desde estado ${doc.status}` },
      { status: 422 }
    );
  }

  const stamp = ROLE_STAMP[accion];
  const now = new Date();
  const updateData: Record<string, unknown> = { status: transition.toStatus };
  if (contenido !== undefined) updateData.contenido = contenido;
  if (transition.toStatus === "VIGENTE") {
    updateData.vigenciaDesde = now;
    // Next mandatory review: 1 year from approval
    const proxima = new Date(now);
    proxima.setFullYear(proxima.getFullYear() + 1);
    updateData.proximaRevision = proxima;
  }
  if (stamp) {
    updateData[stamp.emailField] = session.email;
    updateData[stamp.nombreField] = session.name ?? session.email;
  }

  await prisma.$transaction([
    prisma.documento.update({ where: { id }, data: updateData }),
    prisma.docRevision.create({
      data: {
        documentoId: id,
        accion: transition.accion,
        autorEmail: session.email,
        autorNombre: session.name ?? session.email,
        comentario: comentario ?? null,
        descripcionCambios: descripcionCambios ?? null,
        sinCambios: sinCambios === true,
      },
    }),
  ]);

  const docWithRevisiones = await prisma.documento.findUnique({
    where: { id },
    include: { revisiones: { orderBy: { createdAt: "desc" }, take: 20 } },
  });

  return NextResponse.json(docWithRevisiones);
}
