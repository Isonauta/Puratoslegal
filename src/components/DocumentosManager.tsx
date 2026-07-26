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

export function DocumentosManager({ initialDocumentos, isAdmin }: Props) {
  const router = useRouter();
  const [filtroClausula, setFiltroClausula] = useState("");
  const [filtroNorma, setFiltroNorma] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  const [clausula, setClausula] = useState<string>(ISO_CLAUSULAS[0].codigo);
  const [norma, setNorma] = useState<(typeof NORMAS)[number]>("AMBAS");
  const [tipo, setTipo] = useState<string>(TIPOS_DOCUMENTO[0]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);

  const documentosFiltrados = useMemo(() => {
    return initialDocumentos.filter((d) => {
      if (filtroClausula && d.clausula !== filtroClausula) return false;
      if (filtroNorma && d.norma !== filtroNorma) return false;
      return true;
    });
  }, [initialDocumentos, filtroClausula, filtroNorma]);

  function limpiarFormulario() {
    setClausula(ISO_CLAUSULAS[0].codigo);
    setNorma("AMBAS");
    setTipo(TIPOS_DOCUMENTO[0]);
    setNombre("");
    setDescripcion("");
    setArchivo(null);
    setError("");
  }

  async function subirDocumento(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo || !nombre.trim()) {
      setError("Falta el nombre o el archivo.");
      return;
    }
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
          clausula,
          clausulaNombre: nombreDeClausula(clausula),
          norma,
          tipo,
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          storagePath: path,
          publicUrl: urlData.publicUrl,
          fileName: archivo.name,
          mimeType: archivo.type || undefined,
          sizeBytes: archivo.size,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo guardar el documento.");
      }

      limpiarFormulario();
      setModalAbierto(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el documento.");
    } finally {
      setSubiendo(false);
    }
  }

  async function borrarDocumento(id: string) {
    if (!confirm("¿Borrar este documento? No se puede deshacer.")) return;
    const res = await fetch(`/api/documentos/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filtroClausula}
          onChange={(e) => setFiltroClausula(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">Todos los puntos normativos</option>
          {ISO_CLAUSULAS.map((c) => (
            <option key={c.codigo} value={c.codigo}>
              {c.codigo} · {c.nombre}
            </option>
          ))}
        </select>

        <select
          value={filtroNorma}
          onChange={(e) => setFiltroNorma(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        >
          <option value="">Todas las normas</option>
          {NORMAS.map((n) => (
            <option key={n} value={n}>
              {NORMA_LABEL[n]}
            </option>
          ))}
        </select>

        <button
          onClick={() => setModalAbierto(true)}
          className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          + Subir documento
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Punto</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Norma</th>
              <th className="px-4 py-3">Subido por</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {documentosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  No hay documentos todavía.
                </td>
              </tr>
            )}
            {documentosFiltrados.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 align-top text-zinc-500 dark:text-zinc-400">
                  <div className="font-medium text-zinc-700 dark:text-zinc-200">{d.clausula}</div>
                  <div className="text-xs">{d.clausulaNombre}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">{d.nombre}</div>
                  {d.descripcion && <div className="text-xs text-zinc-500 dark:text-zinc-400">{d.descripcion}</div>}
                </td>
                <td className="px-4 py-3 align-top text-zinc-600 dark:text-zinc-300">{d.tipo}</td>
                <td className="px-4 py-3 align-top text-zinc-600 dark:text-zinc-300">{NORMA_LABEL[d.norma]}</td>
                <td className="px-4 py-3 align-top text-zinc-500 dark:text-zinc-400">{d.subidoPorNombre ?? "—"}</td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center justify-end gap-3">
                    <a
                      href={d.publicUrl}
                      download={d.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      ↓ Descargar
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => borrarDocumento(d.id)}
                        className="text-sm text-red-600 hover:underline dark:text-red-400"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Subir documento</h2>

            <form onSubmit={subirDocumento} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Punto normativo *</label>
                <select
                  value={clausula}
                  onChange={(e) => setClausula(e.target.value)}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {ISO_CLAUSULAS.map((c) => (
                    <option key={c.codigo} value={c.codigo}>
                      {c.codigo} · {c.nombre}
                    </option>
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
                    <option key={n} value={n}>
                      {NORMA_LABEL[n]}
                    </option>
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
                    <option key={t} value={t}>
                      {t}
                    </option>
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

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Archivo *</label>
                <input
                  type="file"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full text-sm text-zinc-700 dark:text-zinc-300"
                />
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalAbierto(false);
                    limpiarFormulario();
                  }}
                  className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={subiendo}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {subiendo ? "Subiendo..." : "Guardar documento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
