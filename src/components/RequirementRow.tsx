"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type EvidenceFile = {
  id: string;
  webUrl: string;
  provider: string;
  status: string;
  fileName: string | null;
};

type EvidenceTemplate = {
  id: string;
  codigoSugerido: string;
  nombre: string;
  files: EvidenceFile[];
};

type Requirement = {
  id: string;
  numero: number;
  titulo: string;
  ambito: string;
  cumple: string;
  responsable: string | null;
  justificacionNoAplica: string | null;
  evidenceLinks: { evidenceTemplate: EvidenceTemplate }[];
};

const CUMPLE_OPTIONS = ["SI", "NO", "NO_APLICA", "PENDIENTE"];
const CUMPLE_LABEL: Record<string, string> = {
  SI: "Cumple",
  NO: "No cumple",
  NO_APLICA: "No aplica",
  PENDIENTE: "Pendiente",
};
const STATUS_OPTIONS = ["POR_GENERAR", "EN_REVISION", "VIGENTE", "VENCIDO", "ACTUALIZAR"];
export const RESPONSABLES = ["Sebastián Corrotea", "Benjamín Henriquez"];

export function RequirementRow({ requirement }: { requirement: Requirement }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cumple, setCumple] = useState(requirement.cumple);
  const [responsable, setResponsable] = useState(requirement.responsable ?? "");
  const [justificacion, setJustificacion] = useState(requirement.justificacionNoAplica ?? "");
  const [savingJustificacion, setSavingJustificacion] = useState(false);
  const [saving, setSaving] = useState(false);

  async function updateField(data: { cumple?: string; responsable?: string | null; justificacionNoAplica?: string | null }) {
    setSaving(true);
    await fetch(`/api/requirements/${requirement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    router.refresh();
  }

  async function updateCumple(value: string) {
    setCumple(value);
    await updateField({ cumple: value });
  }

  async function updateResponsable(value: string) {
    setResponsable(value);
    await updateField({ responsable: value || null });
  }

  async function saveJustificacion() {
    setSavingJustificacion(true);
    await updateField({ justificacionNoAplica: justificacion.trim() || null });
    setSavingJustificacion(false);
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            N°{requirement.numero} · {requirement.ambito} — {requirement.titulo}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Responsable: {requirement.responsable ?? "Sin asignar"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={responsable}
            disabled={saving}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => updateResponsable(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Sin asignar</option>
            {RESPONSABLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={cumple}
            disabled={saving}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => updateCumple(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            {CUMPLE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {CUMPLE_LABEL[o]}
              </option>
            ))}
          </select>
          <span className="text-zinc-400">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          {cumple === "NO_APLICA" && (
            <div className="mb-3 rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Justificación de No aplica</p>
              <textarea
                rows={2}
                placeholder="Ej: La empresa no cuenta con trabajadores en régimen de teletrabajo…"
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                disabled={savingJustificacion}
                onClick={saveJustificacion}
                className="mt-1 rounded bg-zinc-700 px-2 py-1 text-xs text-white hover:bg-zinc-600 disabled:opacity-50 dark:bg-zinc-600"
              >
                {savingJustificacion ? "Guardando…" : "Guardar justificación"}
              </button>
            </div>
          )}
          {requirement.evidenceLinks.length === 0 && cumple !== "NO_APLICA" && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin evidencia asociada a este requisito todavía.</p>
          )}
          <div className="space-y-3">
            {requirement.evidenceLinks.map((link) => (
              <EvidenceTemplateBlock key={link.evidenceTemplate.id} template={link.evidenceTemplate} onChange={() => router.refresh()} />
            ))}
          </div>
          <NewEvidenceForm legalRequirementId={requirement.id} onChange={() => router.refresh()} />
        </div>
      )}
    </div>
  );
}

function NewEvidenceForm({ legalRequirementId, onChange }: { legalRequirementId: string; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [nombre, setNombre] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [provider, setProvider] = useState("SHAREPOINT");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!nombre.trim() || !webUrl.trim()) return;
    setBusy(true);
    await fetch("/api/evidence-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legalRequirementId, nombre: nombre.trim(), webUrl: webUrl.trim(), provider }),
    });
    setBusy(false);
    setNombre("");
    setWebUrl("");
    setAdding(false);
    onChange();
  }

  if (!adding) {
    return (
      <button type="button" onClick={() => setAdding(true)} className="mt-3 text-xs text-blue-600 hover:underline dark:text-blue-400">
        + Vincular nueva evidencia
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded border border-zinc-100 p-3 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Nombre (ej. Certificado de cumplimiento)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="min-w-[220px] flex-1 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-1 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="SHAREPOINT">SharePoint</option>
          <option value="GOOGLE_DRIVE">Google Drive</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          placeholder="https://..."
          value={webUrl}
          onChange={(e) => setWebUrl(e.target.value)}
          className="min-w-[240px] flex-1 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
        <button type="button" disabled={busy} onClick={save} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">
          Guardar
        </button>
        <button type="button" onClick={() => setAdding(false)} className="text-xs text-zinc-500">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function EvidenceTemplateBlock({ template, onChange }: { template: EvidenceTemplate; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [webUrl, setWebUrl] = useState("");
  const [provider, setProvider] = useState("SHAREPOINT");
  const [busy, setBusy] = useState(false);
  const [editingNombre, setEditingNombre] = useState(false);
  const [nombre, setNombre] = useState(template.nombre);

  async function saveNombre() {
    if (!nombre.trim() || nombre === template.nombre) { setEditingNombre(false); return; }
    await fetch(`/api/evidence-templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim() }),
    });
    setEditingNombre(false);
    onChange();
  }

  async function addFile() {
    if (!webUrl.trim()) return;
    setBusy(true);
    await fetch("/api/evidence-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evidenceTemplateId: template.id, webUrl: webUrl.trim(), provider }),
    });
    setBusy(false);
    setWebUrl("");
    setAdding(false);
    onChange();
  }

  async function updateStatus(fileId: string, status: string) {
    await fetch(`/api/evidence-files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onChange();
  }

  async function removeFile(fileId: string) {
    await fetch(`/api/evidence-files/${fileId}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="rounded border border-zinc-100 p-3 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        {editingNombre ? (
          <>
            <input
              autoFocus
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={saveNombre}
              onKeyDown={(e) => { if (e.key === "Enter") saveNombre(); if (e.key === "Escape") setEditingNombre(false); }}
              className="flex-1 rounded border border-blue-400 px-2 py-0.5 text-sm dark:border-blue-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </>
        ) : (
          <button type="button" onClick={() => setEditingNombre(true)} className="text-left text-sm font-medium text-zinc-800 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400" title="Clic para editar nombre">
            {template.codigoSugerido}
            {nombre && nombre !== template.codigoSugerido && ` — ${nombre}`}
            <span className="ml-1 text-xs text-zinc-400">✎</span>
          </button>
        )}
      </div>

      <ul className="mt-2 space-y-1">
        {template.files.map((f) => (
          <li key={f.id} className="flex items-center gap-2 text-xs">
            <a href={f.webUrl} target="_blank" rel="noreferrer" className="truncate text-blue-600 hover:underline dark:text-blue-400">
              {f.fileName || f.webUrl}
            </a>
            <span className="text-zinc-400">({f.provider === "SHAREPOINT" ? "SharePoint" : "Drive"})</span>
            <select
              value={f.status}
              onChange={(e) => updateStatus(f.id, e.target.value)}
              className="rounded border border-zinc-300 bg-white px-1 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => removeFile(f.id)} className="text-zinc-400 hover:text-red-500">
              Eliminar
            </button>
          </li>
        ))}
      </ul>

      {!adding && (
        <button type="button" onClick={() => setAdding(true)} className="mt-2 text-xs text-blue-600 hover:underline dark:text-blue-400">
          + Vincular evidencia
        </button>
      )}

      {adding && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-1 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="SHAREPOINT">SharePoint</option>
            <option value="GOOGLE_DRIVE">Google Drive</option>
          </select>
          <input
            type="url"
            placeholder="https://..."
            value={webUrl}
            onChange={(e) => setWebUrl(e.target.value)}
            className="min-w-[240px] flex-1 rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          <button type="button" disabled={busy} onClick={addFile} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">
            Guardar
          </button>
          <button type="button" onClick={() => setAdding(false)} className="text-xs text-zinc-500">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
