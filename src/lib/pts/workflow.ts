import type { PermitStatus, UserRole } from "@/generated/prisma/client";

export type TransitionAction =
  | "SUBMIT"
  | "APPROVE_SUPERVISOR"
  | "AUTHORIZE_SHE"
  | "START"
  | "CLOSE"
  | "SUSPEND"
  | "CANCEL"
  | "REOPEN";

interface TransitionRule {
  from: PermitStatus[];
  to: PermitStatus;
  allowedRoles: UserRole[];
}

export const TRANSITIONS: Record<TransitionAction, TransitionRule> = {
  SUBMIT: {
    from: ["BORRADOR"],
    to: "ENVIADO_A_APROBACION",
    allowedRoles: ["SOLICITANTE", "CONTRATISTA", "ADMIN"],
  },
  APPROVE_SUPERVISOR: {
    from: ["ENVIADO_A_APROBACION"],
    to: "APROBADO_SUPERVISOR",
    allowedRoles: ["SUPERVISOR", "ADMIN"],
  },
  AUTHORIZE_SHE: {
    from: ["APROBADO_SUPERVISOR"],
    to: "AUTORIZADO_SHE",
    allowedRoles: ["SHE", "ADMIN"],
  },
  START: {
    from: ["AUTORIZADO_SHE"],
    to: "EN_CURSO",
    allowedRoles: ["SOLICITANTE", "CONTRATISTA", "ADMIN"],
  },
  CLOSE: {
    from: ["EN_CURSO"],
    to: "CERRADO",
    allowedRoles: ["SUPERVISOR", "SHE", "ADMIN"],
  },
  SUSPEND: {
    from: ["ENVIADO_A_APROBACION", "APROBADO_SUPERVISOR", "AUTORIZADO_SHE", "EN_CURSO"],
    to: "SUSPENDIDO",
    allowedRoles: ["SUPERVISOR", "SHE", "ADMIN"],
  },
  CANCEL: {
    from: ["BORRADOR", "ENVIADO_A_APROBACION", "APROBADO_SUPERVISOR", "AUTORIZADO_SHE", "SUSPENDIDO"],
    to: "ANULADO",
    allowedRoles: ["SOLICITANTE", "SUPERVISOR", "SHE", "ADMIN"],
  },
  REOPEN: {
    from: ["SUSPENDIDO"],
    to: "EN_CURSO",
    allowedRoles: ["SUPERVISOR", "SHE", "ADMIN"],
  },
};

export function canPerformAction(
  action: TransitionAction,
  currentStatus: PermitStatus,
  role: UserRole
): boolean {
  const rule = TRANSITIONS[action];
  return rule.from.includes(currentStatus) && rule.allowedRoles.includes(role);
}

export function getAvailableActions(
  currentStatus: PermitStatus,
  role: UserRole
): TransitionAction[] {
  return (Object.keys(TRANSITIONS) as TransitionAction[]).filter((action) =>
    canPerformAction(action, currentStatus, role)
  );
}

export const ACTION_LABELS: Record<TransitionAction, string> = {
  SUBMIT: "Enviar a aprobación",
  APPROVE_SUPERVISOR: "Aprobar (Supervisor)",
  AUTHORIZE_SHE: "Autorizar ingreso (SHE)",
  START: "Iniciar trabajo",
  CLOSE: "Cerrar permiso",
  SUSPEND: "Suspender",
  CANCEL: "Anular",
  REOPEN: "Reanudar",
};
