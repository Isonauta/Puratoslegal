"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RESPONSABLES } from "./RequirementRow";

type ActionPlan = {
  id: string;
  noConformidad: number | null;
  titulo: string;
  accionCorrectiva: string;
  responsable: string | null;
  fechaEjecucion: Date | null;
  status: string;
  legalRequirement: { numero: number; ambito: string; titulo: string } | null;
};

const STATUS_OPTIONS = ["ABIERTO", "EN_CURSO", "CERRADO", "VENCIDO"] as const;

const STATUS_LABEL: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_CURSO: "En curso",
  CERRADO: "Cerrado",
  VENCIDO: "Vencido",
};

const STATUS_COLOR: Record<string, string> = {
  ABIERTO:  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  EN_CURSO: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  CERRADO:  "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  VENCIDO:  "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const BORDER_COLOR: Record<string, string> = {
  ABIERTO:  "border-l-amber-400",
  EN_CURSO: "border-l-blue-400",
  CERRADO:  "border-l-green-400",
  VENCIDO:  "border-l-red-500",
};

export function ActionPlanRow({ plan }: { plan: ActionPlan }) {
  const router = useRouter();
  const [status, setStatus] = useState(plan.status);
  const [responsable, setResponsable] = useState(plan.responsable ?? "");
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState(plan.titulo);
  const [accion, setAccion] = useState(plan.accionCorrectiva);
  const [fecha, setFecha] = useState(
    plan.fechaEjecucion ? new Date(plan.fechaEjecucion).toISOString().slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function patch(data: object) {
    setSaving(true);
    await fetch(`/api/action-plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    router.refresh();
  }

  async function saveEdit() {
    await patch({ titulo, accionCorrectiva: accion, fechaEjecucion: fecha || null });
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/action-plans/${plan.id}`, { method: "DELETE" });
    router.refresh();
  }

  const fechaStr = plan.fechaEjecucion
    ? new Date(plan.fechaEjecucion).toLocaleDateString("es-CL")
    : null;

  const isOverdue =
    plan.status !== "CERRADO" &&
    plan.fechaEjecucion &&
    new Date(plan.fechaEjecucion) < new Date();

  return (
    <div
      className={`rounded-lg border border-zinc-200 border-l-4 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${BORDER_COLOR[status]}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            ) : (
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {plan.noConformidad ? `NC N°${plan.noConformidad} · ` : ""}
                {titulo}
              </p>
            )}

            {plan.legalRequirement && (
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Requisito N°{plan.legalRequirement.numero} ({plan.legalRequirement.ambito}) ·{" "}
                {plan.legalRequirement.titulo.slice(0, 80)}
              </p>
            )}

            {editing ? (
              <textarea
                rows={2}
                value={accion}
                onChange={(e) => setAccion(e.target.value)}
                placeholder="Acción correctiva…"
                className="mt-2 w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            ) : (
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{accion}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              {editing ? (
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="rounded border border-zinc-300 px-2 py-0.5 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              ) : fechaStr ? (
                <span className={isOverdue ? "font-medium text-red-600 dark:text-red-400" : ""}>
                  {isOverdue ? "⚠ " : ""}Fecha límite: {fechaStr}
                </span>
              ) : (
                <span className="italic">Sin fecha límite</span>
              )}
            </div>
          </div>

          {/* Controles derecha */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[status]}`}>
              {STATUS_LABEL[status]}
            </span>

            <select
              value={responsable}
              disabled={saving}
              onChange={(e) => {
                setResponsable(e.target.value);
                patch({ responsable: e.target.value || null });
              }}
              className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">Sin asignar</option>
              {RESPONSABLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={status}
              disabled={saving}
              onChange={(e) => {
                setStatus(e.target.value);
                patch({ status: e.target.value });
              }}
              className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de acciones */}
        <div className="mt-3 flex items-center gap-3 border-t border-zinc-100 pt-2 dark:border-zinc-800">
          {editing ? (
            <>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
              <button
                onClick={() => { setEditing(false); setTitulo(plan.titulo); setAccion(plan.accionCorrectiva); }}
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                ✏ Editar
              </button>
              {confirmDelete ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-red-600">¿Eliminar?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="font-medium text-red-600 hover:underline"
                  >
                    {deleting ? "…" : "Sí, eliminar"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-zinc-500">
                    No
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-zinc-300 hover:text-red-500 dark:text-zinc-600"
                >
                  Eliminar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
