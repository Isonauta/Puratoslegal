import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { canPerformAction, TRANSITIONS } from "@/lib/pts/workflow";
import type { TransitionAction } from "@/lib/pts/workflow";
import type { UserRole, AreaCondition, SignatureRole } from "@/generated/prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = session.id;
  const role = (session.role ?? "ADMIN") as UserRole;

  const body: {
    action: TransitionAction;
    signatureImage?: string;
    password?: string;
    close?: { actualEndTime: string; areaCondition: AreaCondition; closeObservations: string };
  } = await req.json();

  const { action, signatureImage, password, close } = body;

  if (!action) return NextResponse.json({ error: "Acción requerida" }, { status: 400 });

  const permit = await prisma.workPermit.findUnique({ where: { id } });
  if (!permit) return NextResponse.json({ error: "Permiso no encontrado" }, { status: 404 });

  if (!canPerformAction(action, permit.status, role)) {
    return NextResponse.json({ error: "Acción no permitida en el estado actual" }, { status: 403 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });

  if (password) {
    const valid = await bcrypt.compare(password, dbUser.passwordHash);
    if (!valid) return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const toStatus = TRANSITIONS[action].to;

  const updateData: Record<string, unknown> = { status: toStatus };
  if (action === "CLOSE" && close) {
    updateData.actualEndTime = new Date(close.actualEndTime);
    updateData.areaCondition = close.areaCondition;
    updateData.closeObservations = close.closeObservations;
  }

  const signatureRoleMap: Partial<Record<TransitionAction, SignatureRole>> = {
    SUBMIT: "SOLICITANTE",
    APPROVE_SUPERVISOR: "SUPERVISOR_APRUEBA",
    AUTHORIZE_SHE: "SHE_AUTORIZA",
    CLOSE: "SUPERVISOR_RECEPCIONA_CIERRE",
  };

  await prisma.$transaction(async (tx) => {
    await tx.workPermit.update({ where: { id }, data: updateData });

    await tx.permitStatusLog.create({
      data: {
        workPermitId: id,
        changedById: userId,
        fromStatus: permit.status,
        toStatus,
      },
    });

    const sigRole = signatureRoleMap[action];
    if (sigRole && signatureImage) {
      await tx.signature.create({
        data: {
          workPermitId: id,
          userId,
          role: sigRole,
          signerName: dbUser.name,
          imageData: signatureImage,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
