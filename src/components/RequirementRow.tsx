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
  tipoDocumento: string;
  documentoNumero: string | null;
  organismo: string;
  articulo: string | null;
  requisitoTexto: string | null;
  formaCumplimiento: string | null;
  cumple: string;
  responsable: string | null;
  justificacionNoAplica: string | null;
  clasificacionSIG: string | null;
  fueraAlcanceSIG: boolean;
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
export const RESPONSABLES = ["Sebastián Corrotea", "Benjamín Henriquez", "Cristian Cordero", "Carlos Neumann"];

const CUMPLE_BG: Record<string, string> = {
  SI:        "border-green-200  bg-green-50  dark:border-green-900  dark:bg-green-950/40",
  PENDIENTE: "border-amber-200  bg-amber-50  dark:border-amber-900  dark:bg-amber-950/40",
  NO:        "border-red-200    bg-red-50    dark:border-red-900    dark:bg-red-950/40",
  NO_APLICA: "border-zinc-200   bg-zinc-50   dark:border-zinc-800   dark:bg-zinc-900",
};

function EvidenceBadge({ links, cumple }: { links: Requirement["evidenceLinks"]; cumple: string }) {
  if (cumple === "NO_APLICA") return null;

  const hasFiles = links.some((l) => l.evidenceTemplate.files.length > 0);
  const hasLinks = links.length > 0;

  if (hasFiles) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        Con evidencia
      </span>
    );
  }
  if (hasLinks) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" /></svg>
        Sin archivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      Sin evidencia
    </span>
  );
}

function ClasificacionBadge({ clasificacion }: { clasificacion: string }) {
  const isRevisar = clasificacion.startsWith("Revisar");
  const isDual = clasificacion.startsWith("Dual");
  const isSST = clasificacion.startsWith("Núcleo SST");
  const isMA = clasificacion.startsWith("Núcleo Ambiental");

  let cls = "inline-block rounded px-1.5 py-0.5 text-xs font-medium ";
  if (isRevisar) cls += "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  else if (isDual) cls += "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
  else if (isSST) cls += "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  else if (isMA) cls += "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  else cls += "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";

  const label = isRevisar ? `⚠ ${clasificacion}` : clasificacion;
  return <span className={cls}>{label}</span>;
}

export function RequirementRow({ requirement, hasActionPlan = false, grouped = false }: { requirement: Requirement; hasActionPlan?: boolean; grouped?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cumple, setCumple] = useState(requirement.cumple);
  const [responsable, setResponsable] = useState(requirement.responsable ?? "");
  const [justificacion, setJustificacion] = useState(requirement.justificacionNoAplica ?? "");
  const [savingJustificacion, setSavingJustificacion] = useState(false);
  const [formaCumplimiento, setFormaCumplimiento] = useState(requirement.formaCumplimiento ?? "");
  const [savingForma, setSavingForma] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fueraAlcance, setFueraAlcance] = useState(requirement.fueraAlcanceSIG);

  async function updateField(data: { cumple?: string; responsable?: string | null; justificacionNoAplica?: string | null; formaCumplimiento?: string | null }) {
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

  async function saveFormaCumplimiento() {
    setSavingForma(true);
    await updateField({ formaCumplimiento: formaCumplimiento.trim() || null });
    setSavingForma(false);
  }

  async function toggleFueraAlcance() {
    const next = !fueraAlcance;
    setFueraAlcance(next);
    await fetch(`/api/requirements/${requirement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fueraAlcanceSIG: next }),
    });
    router.refresh();
  }

  const cardBg = fueraAlcance
    ? "border-zinc-300 bg-white opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
    : hasActionPlan && cumple === "NO"
    ? CUMPLE_BG.PENDIENTE
    : CUMPLE_BG[cumple] ?? CUMPLE_BG.PENDIENTE;

  if (grouped) {
    return (
      <div className={`transition-colors ${fueraAlcance ? "opacity-60" : ""}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full flex-col gap-2 px-5 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 sm:flex-row sm:items-center sm:gap-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {requirement.articulo && (
                <span className="shrink-0 text-sm font-semibold text-blue-700 dark:text-blue-400">
                  Art. {requirement.articulo}
                </span>
              )}
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                cumple === "SI"       ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : cumple === "NO"     ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                : cumple === "NO_APLICA" ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
              }`}>
                {CUMPLE_LABEL[cumple]}
              </span>
              <span className="min-w-0 truncate text-sm text-zinc-700 dark:text-zinc-200">
                {requirement.requisitoTexto ?? requirement.titulo}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Responsable: {requirement.responsable ?? "Sin asignar"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <select
              value={responsable}
              disabled={saving}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateResponsable(e.target.value)}
              className="max-w-[120px] rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              <option value="">Sin asignar</option>
              {RESPONSABLES.map((r) => (
                <option key={r} value={r}>{r.split(" ")[0]}</option>
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
                <option key={o} value={o}>{CUMPLE_LABEL[o]}</option>
              ))}
            </select>
            <EvidenceBadge links={requirement.evidenceLinks} cumple={cumple} />
            <span className="text-zinc-400">{open ? "▲" : "▼"}</span>
          </div>
        </button>
        {open && (
          <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-800/30">
            <p className="mb-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              N°{requirement.numero} · {requirement.ambito} — {requirement.titulo}
            </p>
            <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={toggleFueraAlcance}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  fueraAlcance
                    ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "border-zinc-300 bg-white text-zinc-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {fueraAlcance ? "↩ Incluir en alcance SIG" : "Marcar fuera de alcance SIG"}
              </button>
            </div>
            {cumple === "NO_APLICA" && (
              <div className="mb-3 rounded border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Justificación de No aplica</p>
                <textarea
                  rows={3}
                  placeholder="Ej: La empresa no cuenta con trabajadores en régimen de teletrabajo…"
                  value={justificacion}
                  onChange={(e) => setJustificacion(e.target.value)}
                  className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <div className="mt-2 flex items-center gap-3">
                  <button type="button" disabled={savingJustificacion || !justificacion.trim()} onClick={saveJustificacion}
                    className="rounded bg-zinc-700 px-2 py-1 text-xs text-white hover:bg-zinc-600 disabled:opacity-50 dark:bg-zinc-600">
                    {savingJustificacion ? "Guardando…" : "Guardar justificación"}
                  </button>
                </div>
              </div>
            )}
            {cumple !== "NO_APLICA" && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Nota de evidencia</p>
                <textarea
                  rows={2}
                  placeholder="Describe qué evidencia existe o qué se hará…"
                  value={formaCumplimiento}
                  onChange={(e) => setFormaCumplimiento(e.target.value)}
                  onBlur={saveFormaCumplimiento}
                  className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 placeholder-zinc-400 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
                {savingForma && <p className="mt-0.5 text-xs text-zinc-400">Guardando…</p>}
              </div>
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

  return (
    <div className={`rounded-lg border shadow-sm transition-colors ${cardBg}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col gap-2 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            N°{requirement.numero} · {requirement.ambito} — {requirement.titulo}
          </p>
          <p className="mt-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
            <a
              href={requirement.documentoNumero
                ? `https://www.bcn.cl/leychile/buscar?tipo_norma=&numero=${requirement.documentoNumero}&anio=`
                : "https://www.bcn.cl/leychile"}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {requirement.tipoDocumento}{requirement.documentoNumero ? ` N°${requirement.documentoNumero}` : ""}
            </a>
            {requirement.articulo ? ` · Art. ${requirement.articulo}` : ""}
            <span className="ml-2 font-normal text-zinc-400">{requirement.organismo}</span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Responsable: {requirement.responsable ?? "Sin asignar"}
          </p>
          {hasActionPlan && cumple === "NO" && (
            <p className="mt-0.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                📋 En plan de acción
              </span>
            </p>
          )}
          {(fueraAlcance || requirement.clasificacionSIG) && (
            <p className="mt-0.5">
              {fueraAlcance ? (
                <span className="inline-block rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">Fuera de alcance SIG</span>
              ) : requirement.clasificacionSIG ? (
                <ClasificacionBadge clasificacion={requirement.clasificacionSIG} />
              ) : null}
            </p>
          )}
          {requirement.requisitoTexto && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {requirement.requisitoTexto}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3">
          <select
            value={responsable}
            disabled={saving}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => updateResponsable(e.target.value)}
            className="max-w-[140px] rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Sin asignar</option>
            {RESPONSABLES.map((r) => (
              <option key={r} value={r}>{r.split(" ")[0]}</option>
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
          <EvidenceBadge links={requirement.evidenceLinks} cumple={cumple} />
          <span className="ml-auto text-zinc-400 sm:ml-0">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          {/* Botón fuera de alcance */}
          <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={toggleFueraAlcance}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                fueraAlcance
                  ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "border-zinc-300 bg-white text-zinc-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-orange-700 dark:hover:bg-orange-900/20"
              }`}
            >
              {fueraAlcance ? "↩ Incluir en alcance SIG" : "Marcar fuera de alcance SIG"}
            </button>
          </div>
          {cumple === "NO_APLICA" && (
            <div className="mb-3 rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Justificación de No aplica</p>
              <textarea
                rows={3}
                placeholder="Ej: La empresa no cuenta con trabajadores en régimen de teletrabajo…"
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                className="w-full rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  disabled={savingJustificacion || !justificacion.trim()}
                  onClick={saveJustificacion}
                  className="rounded bg-zinc-700 px-2 py-1 text-xs text-white hover:bg-zinc-600 disabled:opacity-50 dark:bg-zinc-600"
                >
                  {savingJustificacion ? "Guardando…" : "Guardar justificación"}
                </button>
                <p className="text-xs text-zinc-400">
                  Se aplicará automáticamente a todos los artículos que comparten la misma evidencia.
                </p>
              </div>
            </div>
          )}
          {/* Nota de evidencia / forma de cumplimiento — siempre editable */}
          {cumple !== "NO_APLICA" && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Nota de evidencia
              </p>
              <textarea
                rows={2}
                placeholder="Describe qué evidencia existe o qué se hará, aunque aún no tengas el link…"
                value={formaCumplimiento}
                onChange={(e) => setFormaCumplimiento(e.target.value)}
                onBlur={saveFormaCumplimiento}
                className="w-full rounded border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 placeholder-zinc-400 focus:border-blue-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
              {savingForma && <p className="mt-0.5 text-xs text-zinc-400">Guardando…</p>}
            </div>
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
