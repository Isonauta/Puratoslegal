"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PermitStatus, UserRole, AreaCondition } from "@/generated/prisma/client";
import { getAvailableActions, ACTION_LABELS, TransitionAction } from "@/lib/pts/workflow";
import Button from "@/components/pts/ui/Button";
import SignaturePad from "@/components/pts/signature/SignaturePad";
import { AREA_CONDITION_LABELS } from "@/lib/pts/labels";

const SIGNATURE_REQUIRED: TransitionAction[] = ["SUBMIT", "APPROVE_SUPERVISOR", "AUTHORIZE_SHE", "CLOSE"];

export default function PermitActions({
  permitId,
  status,
  role,
}: {
  permitId: string;
  status: PermitStatus;
  role: UserRole;
}) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<TransitionAction | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [areaCondition, setAreaCondition] = useState<AreaCondition>("LIMPIA_Y_SEGURA");
  const [closeObservations, setCloseObservations] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = getAvailableActions(status, role);

  async function submitAction(action: TransitionAction) {
    setLoading(true);
    setError(null);
    try {
      const body: {
        action: TransitionAction;
        signatureImage?: string;
        password?: string;
        close?: { actualEndTime: string; areaCondition: AreaCondition; closeObservations: string };
      } = { action };
      if (signature) body.signatureImage = signature;
      if (SIGNATURE_REQUIRED.includes(action)) body.password = password;
      if (action === "CLOSE") {
        body.close = { actualEndTime: new Date().toISOString(), areaCondition, closeObservations };
      }
      const res = await fetch(`/api/pts/permits/${permitId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al ejecutar la acción");
      }
      setActiveAction(null);
      setSignature(null);
      setPassword("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (actions.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold">Acciones disponibles</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!activeAction && (
        <div className="flex flex-col gap-2">
          {actions.map((action) => (
            <Button
              key={action}
              variant={action === "CANCEL" ? "danger" : action === "SUSPEND" ? "secondary" : "primary"}
              onClick={() => setActiveAction(action)}
            >
              {ACTION_LABELS[action]}
            </Button>
          ))}
        </div>
      )}

      {activeAction && (
        <div className="space-y-3">
          <p className="font-medium">{ACTION_LABELS[activeAction]}</p>
          {activeAction === "CLOSE" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Condición del área</label>
              <select className="input" value={areaCondition} onChange={(e) => setAreaCondition(e.target.value as AreaCondition)}>
                {Object.entries(AREA_CONDITION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <label className="block text-sm font-medium">Observaciones de cierre</label>
              <textarea className="input" value={closeObservations} onChange={(e) => setCloseObservations(e.target.value)} />
            </div>
          )}
          {SIGNATURE_REQUIRED.includes(activeAction) && (
            <>
              <SignaturePad label="Firma digital" onSave={setSignature} />
              <div>
                <label className="block text-sm font-medium mb-1">Confirma tu contraseña para firmar</label>
                <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setActiveAction(null)}>Cancelar</Button>
            <Button
              onClick={() => submitAction(activeAction)}
              disabled={loading || (SIGNATURE_REQUIRED.includes(activeAction) && (!signature || !password))}
            >
              {loading ? "Procesando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
