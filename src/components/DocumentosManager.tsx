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

  // Group by clausula, preserving sort order
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
        limpiarFormulario();
        setModalAbierto(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir el documento.");
      } finally {
        setSubiendo(false);
      }
    } else {
      if (!linkUrl.trim()) { setError("Ingresa la URL del documento."); return; }
      setSubiendo(true);
      setError("");
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
        limpiarFormulario();
        setModalAbierto(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar el enlace.");
      } finally {
        setSubiendo(false);
      }
    }
  }

  async function borrarDocumento(id: string) {
    if (!confirm("¿Borrar este documento? No se puede deshacer.")) return;
    const res = await fetch(`/api/documentos/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Filtros + botón global */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filtroClausula}
          onChange={(e) => setFiltroClausula(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">Todos los puntos normativos</option>
          {ISO_CLAUSULAS.map((c) => (
            <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>
          ))}
        </select>

        <select
          value={filtroNorma}
          onChange={(e) => setFiltroNorma(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">Todas las normas</option>
          {NORMAS.map((n) => (
            <option key={n} value={n}>{NORMA_LABEL[n]}</option>
          ))}
        </select>

        <button
          onClick={() => abrirModal()}
          className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Agregar documento
        </button>
      </div>

      {/* Vista agrupada por cláusula */}
      {grupos.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No hay documentos todavía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map(([cod, { clausulaNombre: clausulaNom, docs }]) => (
            <div key={cod} className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              {/* Cabecera del grupo */}
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{cod}</span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">{clausulaNom}</span>
                  <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {docs.length} doc{docs.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={() => abrirModal(cod)}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-500 hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:hover:border-blue-500 dark:hover:text-blue-400"
                >
                  + Agregar
                </button>
              </div>

              {/* Filas de documentos */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {docs.map((d) => (
                  <div key={d.id} className="flex items-start gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{d.nombre}</span>
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{d.tipo}</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">{NORMA_LABEL[d.norma]}</span>
                      </div>
                      {d.descripcion && (
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{d.descripcion}</p>
                      )}
                      {d.linkUrl && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                          <span>{PROVIDER_ICON[d.linkProvider ?? "SHAREPOINT"]}</span>
                          <span>{PROVIDER_LABEL[d.linkProvider ?? "SHAREPOINT"]}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {d.subidoPorNombre && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">{d.subidoPorNombre}</span>
                      )}
                      {d.linkUrl ? (
                        <a
                          href={d.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Abrir →
                        </a>
                      ) : d.publicUrl ? (
                        <a
                          href={d.publicUrl}
                          download={d.fileName ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          ↓ Descargar
                        </a>
                      ) : null}
                      {isAdmin && (
                        <button
                          onClick={() => borrarDocumento(d.id)}
                          className="text-xs text-zinc-300 hover:text-red-500 dark:text-zinc-600"
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  </div>
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
                <button
                  key={m}
                  type="button"
                  onClick={() => { setModalMode(m); setError(""); }}
                  className={`flex-1 rounded py-1.5 text-sm font-medium transition-colors ${
                    modalMode === m
                      ? "bg-blue-600 text-white"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  {m === "archivo" ? "📁 Subir archivo" : "🔗 Enlace externo"}
                </button>
              ))}
            </div>

            <form onSubmit={subirDocumento} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Punto normativo *</label>
                <select
                  value={clausula}
                  onChange={(e) => setClausula(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {ISO_CLAUSULAS.map((c) => (
                    <option key={c.codigo} value={c.codigo}>{c.codigo} · {c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Norma *</label>
                <select
                  value={norma}
                  onChange={(e) => setNorma(e.target.value as (typeof NORMAS)[number])}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {NORMAS.map((n) => (
                    <option key={n} value={n}>{NORMA_LABEL[n]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de documento *</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {TIPOS_DOCUMENTO.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre del documento *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Procedimiento de identificación de aspectos ambientales"
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {modalMode === "archivo" ? (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Archivo *</label>
                  <input
                    type="file"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                    className="mt-1 w-full text-sm text-zinc-700 dark:text-zinc-300"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Proveedor *</label>
                    <select
                      value={linkProvider}
                      onChange={(e) => setLinkProvider(e.target.value)}
                      className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="SHAREPOINT">SharePoint / OneDrive</option>
                      <option value="GOOGLE_DRIVE">Google Drive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">URL del documento *</label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://…"
                      className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <p className="mt-1 text-xs text-zinc-400">Al hacer clic en &quot;Abrir&quot; se abrirá directamente en {PROVIDER_LABEL[linkProvider]}.</p>
                  </div>
                </>
              )}

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalAbierto(false); limpiarFormulario(); }}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={subiendo}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
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
