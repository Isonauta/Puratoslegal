"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Documento } from "@/generated/prisma/client";
import { ISO_CLAUSULAS, TIPOS_DOCUMENTO, NORMA_LABEL, nombreDeClausula } from "@/lib/isoClauses";
import { getSupabaseBrowser, DOCUMENTOS_BUCKET } from "@/lib/supabaseBrowser";

type Props = {
  initialDocumentos: Documento[];
  isAdmin: boolean;
};

const NORMAS = ["ISO14001", "ISO45001", "AMBAS"] as const;

const PROVIDER_LABEL: Record<string, string> = {
  SHAREPOINT: "SharePoint",
  GOOGLE_DRIVE: "Google Drive",
};

const PROVIDER_ICON: Record<string, string> = {
  SHAREPOINT: "📄",
  GOOGLE_DRIVE: "📁",
};

type ModalMode = "archivo" | "enlace";

// ─── Fila editable ───────────────────────────────────────────────────────────

function DocRow({ doc, isAdmin, onDeleted }: { doc: Documento; isAdmin: boolean; onDeleted: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editNombre, setEditNombre] = useState(doc.nombre);
  const [editDesc, setEditDesc] = useState(doc.descripcion ?? "");
  const [editLinkUrl, setEditLinkUrl] = useState(doc.linkUrl ?? "");
  const [editProvider, setEditProvider] = useState<"SHAREPOINT" | "GOOGLE_DRIVE">(doc.linkProvider ?? "SHAREPOINT");

  async function guardar() {
    setSaving(true);
    await fetch(`/api/documentos/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: editNombre,
        descripcion: editDesc || null,
        ...(doc.linkUrl !== undefined ? { linkUrl: editLinkUrl, linkProvider: editProvider } : {}),
      }),
    });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  async function borrar() {
    setDeleting(true);
    const res = await fetch(`/api/documentos/${doc.id}`, { method: "DELETE" });
    if (res.ok) onDeleted();
    else setDeleting(false);
  }

  if (editing) {
    return (
      <div className="space-y-2 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Nombre</label>
            <input
              value={editNombre}
              onChange={(e) => setEditNombre(e.target.value)}
              className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Descripción</label>
            <input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        {doc.linkUrl !== null && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">Proveedor</label>
              <select
                value={editProvider}
                onChange={(e) => setEditProvider(e.target.value as "SHAREPOINT" | "GOOGLE_DRIVE")}
                className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="SHAREPOINT">SharePoint / OneDrive</option>
                <option value="GOOGLE_DRIVE">Google Drive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">URL</label>
              <input
                type="url"
                value={editLinkUrl}
                onChange={(e) => setEditLinkUrl(e.target.value)}
                placeholder="https://…"
                className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={guardar}
            disabled={saving || !editNombre.trim()}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setEditNombre(doc.nombre);
              setEditDesc(doc.descripcion ?? "");
              setEditLinkUrl(doc.linkUrl ?? "");
              setEditProvider(doc.linkProvider ?? "SHAREPOINT");
            }}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{doc.nombre}</span>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{doc.tipo}</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{NORMA_LABEL[doc.norma]}</span>
        </div>
        {doc.descripcion && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{doc.descripcion}</p>
        )}
        {doc.linkUrl && (
          <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
            <span>{PROVIDER_ICON[doc.linkProvider ?? "SHAREPOINT"]}</span>
            <span>{PROVIDER_LABEL[doc.linkProvider ?? "SHAREPOINT"]}</span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {doc.subidoPorNombre && (
          <span className="hidden text-xs text-zinc-400 dark:text-zinc-500 sm:inline">{doc.subidoPorNombre}</span>
        )}
        {doc.linkUrl ? (
          <a href={doc.linkUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-transform">
            <span>{PROVIDER_ICON[doc.linkProvider ?? "SHAREPOINT"]}</span>
            Abrir
          </a>
        ) : doc.publicUrl ? (
          <a href={doc.publicUrl} download={doc.fileName ?? undefined} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 active:scale-95 transition-transform dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
            ↓ Descargar
          </a>
        ) : null}
        {isAdmin && (
          <>
            <button onClick={() => setEditing(true)}
              className="text-xs text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400">
              ✏ Editar
            </button>
            {confirmDelete ? (
              <span className="flex items-center gap-1 text-xs">
                <span className="text-red-600">¿Borrar?</span>
                <button onClick={borrar} disabled={deleting}
                  className="font-medium text-red-600 hover:underline">
                  {deleting ? "…" : "Sí"}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-zinc-500">No</button>
              </span>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="text-xs text-zinc-300 hover:text-red-500 dark:text-zinc-600">
                Borrar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Manager principal ────────────────────────────────────────────────────────

export function DocumentosManager({ initialDocumentos, isAdmin }: Props) {
  const router = useRouter();
  const [filtroClausula, setFiltroClausula] = useState("");
  const [filtroNorma, setFiltroNorma] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("archivo");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  const [clausula, setClausula] = useState<string>(ISO_CLAUSULAS[0].codigo);
  const [norma, setNorma] = useState<(typeof NORMAS)[number]>("AMBAS");
  const [tipo, setTipo] = useState<string>(TIPOS_DOCUMENTO[0]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkProvider, setLinkProvider] = useState("SHAREPOINT");

  const documentosFiltrados = useMemo(() => {
    return initialDocumentos.filter((d) => {
      if (filtroClausula && d.clausula !== filtroClausula) return false;
      if (filtroNorma && d.norma !== filtroNorma) return false;
      return true;
    });
  }, [initialDocumentos, filtroClausula, filtroNorma]);

  const grupos = useMemo(() => {
    const map = new Map<string, { clausulaNombre: string; docs: Documento[] }>();
    for (const d of documentosFiltrados) {
      const entry = map.get(d.clausula) ?? { clausulaNombre: d.clausulaNombre, docs: [] };
      entry.docs.push(d);
      map.set(d.clausula, entry);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [documentosFiltrados]);

  function abrirModal(clausulaPreseleccionada?: string) {
    if (clausulaPreseleccionada) setClausula(clausulaPreseleccionada);
    setModalAbierto(true);
  }

  function limpiarFormulario() {
    setClausula(ISO_CLAUSULAS[0].codigo);
    setNorma("AMBAS");
    setTipo(TIPOS_DOCUMENTO[0]);
    setNombre("");
    setDescripcion("");
    setArchivo(null);
    setLinkUrl("");
    setLinkProvider("SHAREPOINT");
    setError("");
  }

  async function subirDocumento(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError("Falta el nombre del documento."); return; }

    if (modalMode === "archivo") {
      if (!archivo) { setError("Selecciona un archivo."); return; }
      setSubiendo(true);
      setError("");
      try {
        const supabase = getSupabaseBrowser();
        const path = `${clausula}/${Date.now()}-${archivo.name}`;
        const { error: uploadError } = await supabase.storage.from(DOCUMENTOS_BUCKET).upload(path, archivo);
        if (uploadError) throw new Error(uploadError.message);
        const { data: urlData } = supabase.storage.from(DOCUMENTOS_BUCKET).getPublicUrl(path);

        const res = await fetch("/api/documentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clausula, clausulaNombre: nombreDeClausula(clausula), norma, tipo,
            nombre: nombre.trim(), descripcion: descripcion.trim() || undefined,
            storagePath: path, publicUrl: urlData.publicUrl,
            fileName: archivo.name, mimeType: archivo.type || undefined, sizeBytes: archivo.size,
          }),
        });
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Error al guardar."); }
        limpiarFormulario(); setModalAbierto(false); router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir el documento.");
      } finally { setSubiendo(false); }
    } else {
      if (!linkUrl.trim()) { setError("Ingresa la URL del documento."); return; }
      setSubiendo(true); setError("");
      try {
        const res = await fetch("/api/documentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clausula, clausulaNombre: nombreDeClausula(clausula), norma, tipo,
            nombre: nombre.trim(), descripcion: descripcion.trim() || undefined,
            linkUrl: linkUrl.trim(), linkProvider,
          }),
        });
        if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Error al guardar."); }
        limpiarFormulario(); setModalAbierto(false); router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar el enlace.");
      } finally { setSubiendo(false); }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select value={filtroClausula} onChange={(e) => setFiltroClausula(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          <option value="">Todos los puntos normativos</option>
          {ISO_CLAUSULAS.map((c) => (
            <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>
          ))}
        </select>

        <select value={filtroNorma} onChange={(e) => setFiltroNorma(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          <option value="">Todas las normas</option>
          {NORMAS.map((n) => (
            <option key={n} value={n}>{NORMA_LABEL[n]}</option>
          ))}
        </select>

        <button onClick={() => abrirModal()}
          className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
          + Agregar documento
        </button>
      </div>

      {grupos.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No hay documentos todavía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map(([cod, { clausulaNombre: clausulaNom, docs }]) => (
            <div key={cod} className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{cod}</span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{clausulaNom}</span>
                  <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {docs.length} doc{docs.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <button onClick={() => abrirModal(cod)}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-500 hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:hover:border-blue-500 dark:hover:text-blue-400">
                  + Agregar
                </button>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {docs.map((d) => (
                  <DocRow key={d.id} doc={d} isAdmin={isAdmin} onDeleted={() => router.refresh()} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Agregar documento</h2>

            <div className="mt-3 flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-700">
              {(["archivo", "enlace"] as ModalMode[]).map((m) => (
                <button key={m} type="button" onClick={() => { setModalMode(m); setError(""); }}
                  className={`flex-1 rounded py-1.5 text-sm font-medium transition-colors ${
                    modalMode === m ? "bg-blue-600 text-white" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}>
                  {m === "archivo" ? "📁 Subir archivo" : "🔗 Enlace externo"}
                </button>
              ))}
            </div>

            <form onSubmit={subirDocumento} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Punto normativo *</label>
                <select value={clausula} onChange={(e) => setClausula(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  {ISO_CLAUSULAS.map((c) => (
                    <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Norma *</label>
                <select value={norma} onChange={(e) => setNorma(e.target.value as (typeof NORMAS)[number])}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  {NORMAS.map((n) => (<option key={n} value={n}>{NORMA_LABEL[n]}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de documento *</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                  {TIPOS_DOCUMENTO.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre del documento *</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Procedimiento de identificación de aspectos ambientales"
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Descripción</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              </div>

              {modalMode === "archivo" ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Archivo *</label>
                  <input type="file" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                    className="mt-1 w-full text-sm text-zinc-700 dark:text-zinc-300" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Proveedor *</label>
                    <select value={linkProvider} onChange={(e) => setLinkProvider(e.target.value)}
                      className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                      <option value="SHAREPOINT">SharePoint / OneDrive</option>
                      <option value="GOOGLE_DRIVE">Google Drive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">URL del documento *</label>
                    <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…"
                      className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
                    <p className="mt-1 text-xs text-zinc-400">Al hacer clic en &quot;Abrir&quot; se abrirá directamente en {PROVIDER_LABEL[linkProvider]}.</p>
                  </div>
                </>
              )}

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setModalAbierto(false); limpiarFormulario(); }}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                  Cancelar
                </button>
                <button type="submit" disabled={subiendo}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
                  {subiendo ? "Guardando..." : "Guardar documento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
