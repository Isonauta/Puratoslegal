import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { DocStatus } from "@/generated/prisma/client";

// Transitions allowed per action
const TRANSITIONS: Record<string, { fromStatus: DocStatus[]; toStatus: DocStatus; accion: string }> = {
  enviar_revision: {
    fromStatus: ["BORRADOR", "RECHAZADO"],
    toStatus: "EN_REVISION",
    accion: "ENVIADO_REVISION",
  },
  aprobar_revision: {
    fromStatus: ["EN_REVISION"],
    toStatus: "EN_APROBACION",
    accion: "APROBADO_REVISION",
  },
  devolver: {
    fromStatus: ["EN_REVISION", "EN_APROBACION"],
    toStatus: "BORRADOR",
    accion: "DEVUELTO",
  },
  aprobar: {
    fromStatus: ["EN_APROBACION"],
    toStatus: "VIGENTE",
    accion: "APROBADO",
  },
  rechazar: {
    fromStatus: ["EN_APROBACION"],
    toStatus: "RECHAZADO",
    accion: "RECHAZADO",
  },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { accion, comentario, contenido } = await req.json();

  const transition = TRANSITIONS[accion];
  if (!transition) {
    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  }

  const doc = await prisma.documento.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });

  if (!transition.fromStatus.includes(doc.status)) {
    return NextResponse.json(
      { error: `No se puede ejecutar "${accion}" desde estado ${doc.status}` },
      { status: 422 }
    );
  }

  const updateData: Record<string, unknown> = {
    status: transition.toStatus,
  };
  if (contenido !== undefined) updateData.contenido = contenido;
  if (transition.toStatus === "VIGENTE") updateData.vigenciaDesde = new Date();

  const [updatedDoc] = await prisma.$transaction([
    prisma.documento.update({ where: { id }, data: updateData }),
    prisma.docRevision.create({
      data: {
        documentoId: id,
        accion: transition.accion,
        autorEmail: session.email,
        autorNombre: session.name ?? session.email,
        comentario: comentario ?? null,
      },
    }),
  ]);

  return NextResponse.json(updatedDoc);
}
