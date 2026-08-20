"use client";

import { useState } from "react";

type DocStatus = "BORRADOR" | "EN_REVISION" | "EN_APROBACION" | "VIGENTE" | "RECHAZADO";

interface DocRevision {
  id: string;
  accion: string;
  autorNombre: string;
  comentario: string | null;
  descripcionCambios: string | null;
  sinCambios: boolean;
  createdAt: string | Date;
}

interface Documento {
  id: string;
  clausula: string;
  clausulaNombre: string;
  norma: string;
  tipo: string;
  nombre: string;
  descripcion: string | null;
  status: DocStatus;
  elaboradorNombre: string | null;
  elaboradorEmail: string | null;
  revisorNombre: string | null;
  revisorEmail: string | null;
  aprobadorNombre: string | null;
  aprobadorEmail: string | null;
  contenido: string | null;
  versionCode: string | null;
  vigenciaDesde: string | Date | null;
  proximaRevision: string | Date | null;
  publicUrl: string | null;
  linkUrl: string | null;
  revisiones: DocRevision[];
  createdAt: string | Date;
}

const STATUS_LABEL: Record<DocStatus, string> = {
  BORRADOR: "Borrador",
  EN_REVISION: "En revisión",
  EN_APROBACION: "En aprobación",
  VIGENTE: "Vigente",
  RECHAZADO: "Rechazado",
};

const STATUS_COLOR: Record<DocStatus, string> = {
  BORRADOR: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  EN_REVISION: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  EN_APROBACION: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  VIGENTE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  RECHAZADO: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const STEPS: { status: DocStatus; label: string }[] = [
  { status: "BORRADOR", label: "Borrador" },
  { status: "EN_REVISION", label: "Revisión" },
  { status: "EN_APROBACION", label: "Aprobación" },
  { status: "VIGENTE", label: "Vigente" },
];

const STEP_ORDER: Record<DocStatus, number> = {
  BORRADOR: 0, EN_REVISION: 1, EN_APROBACION: 2, VIGENTE: 3, RECHAZADO: -1,
};

interface Props {
  initialDocs: Documento[];
  userEmail: string;
  userName: string;
  isAdmin: boolean;
}

function getRevisionStatus(doc: Documento): "al_dia" | "por_revisar" | "vencido" | null {
  if (doc.status !== "VIGENTE" || !doc.proximaRevision) return null;
  const now = Date.now();
  const proxima = new Date(doc.proximaRevision).getTime();
  const diff = proxima - now;
  if (diff < 0) return "vencido";
  if (diff < 60 * 24 * 60 * 60 * 1000) return "por_revisar"; // < 60 days
  return "al_dia";
}

const REVISION_STATUS_LABEL = {
  al_dia: { label: "Al día", color: "bg-green-100 text-green-700" },
  por_revisar: { label: "Por revisar", color: "bg-amber-100 text-amber-700" },
  vencido: { label: "Revisión vencida", color: "bg-red-100 text-red-700" },
};

export default function SigDocumentosClient({ initialDocs, userEmail, isAdmin }: Props) {
  const [docs, setDocs] = useState<Documento[]>(initialDocs);
  const [selected, setSelected] = useState<Documento | null>(null);
  const [comentario, setComentario] = useState("");
  const [descripcionCambios, setDescripcionCambios] = useState("");
  const [sinCambios, setSinCambios] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<DocStatus | "TODOS">("TODOS");
  const [q, setQ] = useState("");
  const [filterTipo, setFilterTipo] = useState("");

  const tipos = [...new Set(docs.map(d => d.tipo))].sort();

  const filtered = docs.filter(d => {
    if (filter !== "TODOS" && d.status !== filter) return false;
    if (filterTipo && d.tipo !== filterTipo) return false;
    if (q) {
      const lower = q.toLowerCase();
      if (
        !d.nombre.toLowerCase().includes(lower) &&
        !d.clausula.toLowerCase().includes(lower) &&
        !(d.clausulaNombre ?? "").toLowerCase().includes(lower) &&
        !(d.descripcion ?? "").toLowerCase().includes(lower)
      ) return false;
    }
    return true;
  });

  const counts: Record<string, number> = { TODOS: docs.length };
  for (const d of docs) counts[d.status] = (counts[d.status] ?? 0) + 1;

  async function runAccion(accion: string, extraData?: Record<string, unknown>) {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sig/documentos/${selected.id}/accion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion,
          comentario: comentario || undefined,
          descripcionCambios: descripcionCambios || undefined,
          sinCambios,
          ...extraData,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Error al ejecutar acción");
        return;
      }
      const updated = await res.json();
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
      setSelected((prev) => (prev ? { ...prev, ...updated } : null));
      setComentario("");
      setDescripcionCambios("");
      setSinCambios(false);
    } finally {
      setLoading(false);
    }
  }

  function canAct(doc: Documento, accion: string) {
    if (isAdmin) return true;
    switch (accion) {
      case "enviar_revision": return doc.elaboradorEmail === userEmail;
      case "aprobar_revision":
      case "devolver_revision": return doc.revisorEmail === userEmail;
      case "aprobar":
      case "rechazar": return doc.aprobadorEmail === userEmail;
      default: return false;
    }
  }

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nombre, cláusula…"
          className="flex-1 min-w-[200px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <select
          value={filterTipo}
          onChange={e => setFilterTipo(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">Todos los tipos</option>
          {tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(q || filterTipo) && (
          <button onClick={() => { setQ(""); setFilterTipo(""); }}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
            Limpiar
          </button>
        )}
      </div>

      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["TODOS", "BORRADOR", "EN_REVISION", "EN_APROBACION", "VIGENTE", "RECHAZADO"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === s
                  ? "bg-[#C41230] text-white border-[#C41230]"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
              }`}
            >
              {s === "TODOS" ? "Todos" : STATUS_LABEL[s]} {counts[s] ? `(${counts[s]})` : ""}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 bg-[#C41230] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#9B0E26] transition-colors"
          >
            + Nuevo documento
          </button>
        )}
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">
          {q || filterTipo ? "Sin resultados para esta búsqueda." : "No hay documentos en este estado."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <button
              key={doc.id}
              onClick={() => { setSelected(doc); setComentario(""); setDescripcionCambios(""); setSinCambios(false); }}
              className="w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-5 py-4 hover:border-[#C41230] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">{doc.nombre}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {doc.clausula} · {doc.tipo} · {doc.norma}
                    {doc.versionCode && ` · ${doc.versionCode}`}
                  </p>
                  {doc.elaboradorNombre && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Elaborador: {doc.elaboradorNombre}
                      {doc.revisorNombre && ` · Revisor: ${doc.revisorNombre}`}
                      {doc.aprobadorNombre && ` · Aprobador: ${doc.aprobadorNombre}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[doc.status]}`}>
                    {STATUS_LABEL[doc.status]}
                  </span>
                  {(() => {
                    const rs = getRevisionStatus(doc);
                    if (!rs) return null;
                    const { label, color } = REVISION_STATUS_LABEL[rs];
                    return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
                  })()}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Workflow modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wide">{selected.tipo} · {selected.norma}</p>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{selected.nombre}</h2>
                <p className="text-sm text-zinc-500">{selected.clausula} — {selected.clausulaNombre}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-400 hover:text-zinc-700 text-xl leading-none mt-1">×</button>
            </div>

            {/* Step indicator */}
            {selected.status !== "RECHAZADO" && (
              <div className="px-6 pt-5">
                <div className="flex items-center gap-0">
                  {STEPS.map((step, i) => {
                    const current = STEP_ORDER[selected.status];
                    const done = current > i;
                    const active = current === i;
                    return (
                      <div key={step.status} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                            done ? "bg-[#C41230] border-[#C41230] text-white"
                            : active ? "bg-white border-[#C41230] text-[#C41230] dark:bg-zinc-900"
                            : "bg-white border-zinc-200 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-700"
                          }`}>
                            {done ? "✓" : i + 1}
                          </div>
                          <span className={`text-[10px] font-medium ${active ? "text-[#C41230]" : done ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-300 dark:text-zinc-600"}`}>
                            {step.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mb-4 mx-1 ${done ? "bg-[#C41230]" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              {/* Roles */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Elaborador", name: selected.elaboradorNombre, email: selected.elaboradorEmail },
                  { label: "Revisor", name: selected.revisorNombre, email: selected.revisorEmail },
                  { label: "Aprobador", name: selected.aprobadorNombre, email: selected.aprobadorEmail },
                ].map((r) => (
                  <div key={r.label} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400 font-semibold">{r.label}</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 font-medium truncate mt-0.5">{r.name ?? "—"}</p>
                    {r.email && <p className="text-xs text-zinc-400 truncate">{r.email}</p>}
                  </div>
                ))}
              </div>

              {/* Document link */}
              {(selected.publicUrl || selected.linkUrl) && (
                <a
                  href={selected.publicUrl ?? selected.linkUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[#C41230] hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver documento
                </a>
              )}

              {/* Vigente banner */}
              {selected.status === "VIGENTE" && selected.vigenciaDesde && (() => {
                const rs = getRevisionStatus(selected);
                const proximaDate = selected.proximaRevision ? new Date(selected.proximaRevision) : null;
                const bannerBorder = rs === "vencido" ? "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                  : rs === "por_revisar" ? "border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
                  : "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800";
                const textMain = rs === "vencido" ? "text-red-800 dark:text-red-300"
                  : rs === "por_revisar" ? "text-amber-800 dark:text-amber-300"
                  : "text-green-800 dark:text-green-300";
                const textSub = rs === "vencido" ? "text-red-700 dark:text-red-400"
                  : rs === "por_revisar" ? "text-amber-700 dark:text-amber-400"
                  : "text-green-700 dark:text-green-400";
                return (
                  <div className={`border rounded-xl px-4 py-3 ${bannerBorder}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wide ${textSub}`}>Documento vigente</p>
                        <p className={`text-sm font-medium mt-0.5 ${textMain}`}>
                          {selected.versionCode ?? "v1.0"} · Aprobado el {new Date(selected.vigenciaDesde).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {selected.aprobadorNombre && (
                          <p className={`text-xs mt-0.5 ${textSub}`}>Aprobado por: <strong>{selected.aprobadorNombre}</strong></p>
                        )}
                      </div>
                      {proximaDate && (
                        <div className="text-right">
                          <p className={`text-xs ${textSub}`}>Próxima revisión</p>
                          <p className={`text-sm font-bold ${textMain}`}>
                            {proximaDate.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          {rs === "vencido" && <p className="text-[10px] text-red-600 font-semibold mt-0.5">⚠ Vencida</p>}
                          {rs === "por_revisar" && <p className="text-[10px] text-amber-600 font-semibold mt-0.5">⏰ Revisar pronto</p>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Revision history — audit trail */}
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                  Trazabilidad del documento
                </p>
                {selected.revisiones.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">Sin acciones registradas aún.</p>
                ) : (
                  <ol className="relative border-l-2 border-zinc-100 dark:border-zinc-800 space-y-4 pl-5">
                    {[...selected.revisiones].reverse().map((r) => {
                      const accionLabel: Record<string, { label: string; color: string }> = {
                        ENVIADO_REVISION: { label: "Enviado a revisión", color: "bg-blue-500" },
                        APROBADO_REVISION: { label: "Revisión aprobada", color: "bg-amber-500" },
                        DEVUELTO: { label: "Devuelto con observaciones", color: "bg-orange-500" },
                        APROBADO: { label: "Aprobado y publicado", color: "bg-green-500" },
                        RECHAZADO: { label: "Rechazado", color: "bg-red-500" },
                      };
                      const meta = accionLabel[r.accion] ?? { label: r.accion, color: "bg-zinc-400" };
                      const fecha = new Date(r.createdAt);
                      return (
                        <li key={r.id} className="relative">
                          <span className={`absolute -left-[1.4rem] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${meta.color}`} />
                          <div>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{meta.label}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              <span className="font-medium text-zinc-600 dark:text-zinc-300">{r.autorNombre}</span>
                              <span className="mx-1">·</span>
                              {fecha.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                              {" "}
                              {fecha.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            {r.sinCambios && (
                              <p className="mt-1 text-xs text-zinc-400 italic">Sin cambios en esta revisión.</p>
                            )}
                            {r.descripcionCambios && (
                              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded px-2 py-1">
                                <span className="font-semibold text-zinc-500 uppercase tracking-wide text-[10px]">Cambios: </span>
                                {r.descripcionCambios}
                              </p>
                            )}
                            {r.comentario && (
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-800 rounded px-2 py-1">
                                "{r.comentario}"
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {/* Changes field — shown when in revision or approval step */}
              {(selected.status === "EN_REVISION" || selected.status === "EN_APROBACION" || selected.status === "BORRADOR" || selected.status === "RECHAZADO") && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Descripción de cambios</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sinCambios}
                      onChange={(e) => { setSinCambios(e.target.checked); if (e.target.checked) setDescripcionCambios(""); }}
                      className="rounded border-zinc-300 text-[#C41230] focus:ring-[#C41230]"
                    />
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">Sin cambios en esta revisión</span>
                  </label>
                  {!sinCambios && (
                    <textarea
                      value={descripcionCambios}
                      onChange={(e) => setDescripcionCambios(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-[#C41230]"
                      placeholder="Ej: se actualizó sección 3.2 sobre EPP requerido, se eliminó referencia a D.S. 40..."
                    />
                  )}
                </div>
              )}

              {/* Comment box */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Observaciones (opcional)</label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 resize-none focus:outline-none focus:ring-2 focus:ring-[#C41230]"
                  placeholder="Correcciones requeridas, motivo de rechazo..."
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {selected.status === "BORRADOR" && canAct(selected, "enviar_revision") && (
                  <button onClick={() => runAccion("enviar_revision")} disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 transition-colors">
                    Enviar a revisión →
                  </button>
                )}
                {selected.status === "RECHAZADO" && canAct(selected, "enviar_revision") && (
                  <button onClick={() => runAccion("enviar_revision")} disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 transition-colors">
                    Re-enviar a revisión →
                  </button>
                )}
                {selected.status === "EN_REVISION" && (
                  <>
                    {canAct(selected, "aprobar_revision") && (
                      <button onClick={() => runAccion("aprobar_revision")} disabled={loading}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 transition-colors">
                        Aprobar revisión →
                      </button>
                    )}
                    {canAct(selected, "devolver_revision") && (
                      <button onClick={() => runAccion("devolver")} disabled={loading}
                        className="border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        Devolver al elaborador
                      </button>
                    )}
                  </>
                )}
                {selected.status === "EN_APROBACION" && (
                  <>
                    {canAct(selected, "aprobar") && (
                      <button onClick={() => runAccion("aprobar")} disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 transition-colors">
                        Aprobar y publicar ✓
                      </button>
                    )}
                    {canAct(selected, "rechazar") && (
                      <button onClick={() => runAccion("rechazar")} disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl disabled:opacity-50 transition-colors">
                        Rechazar
                      </button>
                    )}
                    {canAct(selected, "devolver_revision") && (
                      <button onClick={() => runAccion("devolver")} disabled={loading}
                        className="border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        Devolver a revisión
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New document modal */}
      {showNew && (
        <NewDocModal
          onClose={() => setShowNew(false)}
          onCreated={(doc) => {
            setDocs((prev) => [doc, ...prev]);
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function NewDocModal({ onClose, onCreated }: { onClose: () => void; onCreated: (doc: Documento) => void }) {
  const [form, setForm] = useState({
    clausula: "", clausulaNombre: "", norma: "ISO45001", tipo: "Procedimiento",
    nombre: "", descripcion: "", versionCode: "v1.0",
    elaboradorEmail: "", elaboradorNombre: "",
    revisorEmail: "", revisorNombre: "",
    aprobadorEmail: "", aprobadorNombre: "",
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/sig/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { alert("Error al crear documento"); return; }
      const doc = await res.json();
      onCreated(doc);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Nuevo documento</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl">×</button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Cláusula</label>
              <input value={form.clausula} onChange={(e) => set("clausula", e.target.value)} required
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41230]" placeholder="p.ej. 8.1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nombre cláusula</label>
              <input value={form.clausulaNombre} onChange={(e) => set("clausulaNombre", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41230]" placeholder="Planificación operativa" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nombre del documento</label>
            <input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required
              className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41230]" placeholder="Procedimiento de trabajo seguro en altura" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Tipo</label>
              <select value={form.tipo} onChange={(e) => set("tipo", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41230]">
                <option>Procedimiento</option><option>Matriz</option><option>Registro</option><option>Instructivo</option><option>Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Norma</label>
              <select value={form.norma} onChange={(e) => set("norma", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41230]">
                <option value="ISO45001">ISO 45001</option><option value="ISO14001">ISO 14001</option><option value="AMBAS">Ambas</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Versión</label>
              <input value={form.versionCode} onChange={(e) => set("versionCode", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41230]" />
            </div>
          </div>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide pt-2">Roles del flujo</p>
          {[
            { role: "Elaborador", emailKey: "elaboradorEmail", nameKey: "elaboradorNombre" },
            { role: "Revisor", emailKey: "revisorEmail", nameKey: "revisorNombre" },
            { role: "Aprobador", emailKey: "aprobadorEmail", nameKey: "aprobadorNombre" },
          ].map(({ role, emailKey, nameKey }) => (
            <div key={role} className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400">{role} — nombre</label>
                <input value={form[nameKey as keyof typeof form]} onChange={(e) => set(nameKey, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41230]" />
              </div>
              <div>
                <label className="text-xs text-zinc-400">{role} — email</label>
                <input type="email" value={form[emailKey as keyof typeof form]} onChange={(e) => set(emailKey, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41230]" />
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Cancelar</button>
            <button type="submit" disabled={saving}
              className="bg-[#C41230] hover:bg-[#9B0E26] text-white text-sm font-semibold px-5 py-2 rounded-xl disabled:opacity-50 transition-colors">
              {saving ? "Creando..." : "Crear documento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
