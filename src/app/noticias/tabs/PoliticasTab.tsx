"use client";
import { useState, useRef } from "react";

type Politica = { id: string; titulo: string; tipo: string; contenido: string | null; pdfUrl: string | null; publicado: boolean; orden: number; createdAt: string; updatedAt: string };

const TIPOS = [
  { value: "SALUD_SEGURIDAD", label: "Salud y Seguridad" },
  { value: "AMBIENTAL", label: "Ambiental" },
  { value: "CALIDAD", label: "Calidad" },
  { value: "OTRO", label: "Otra política" },
];

function tipoLabel(tipo: string) {
  return TIPOS.find(t => t.value === tipo)?.label ?? tipo;
}

function tipoColor(tipo: string) {
  if (tipo === "SALUD_SEGURIDAD") return "bg-red-50 text-red-700 border-red-200";
  if (tipo === "AMBIENTAL") return "bg-green-50 text-green-700 border-green-200";
  if (tipo === "CALIDAD") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function PoliticaCard({ p, isAdmin, onDelete }: { p: Politica; isAdmin: boolean; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar esta política?")) return;
    setDeleting(true);
    await fetch("/api/politicas", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }) });
    onDelete();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${tipoColor(p.tipo)}`}>{tipoLabel(p.tipo)}</span>
        <span className="text-sm font-semibold text-gray-900 flex-1">{p.titulo}</span>
        <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {p.pdfUrl && (
            <a
              href={p.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg"
            >
              <span>📄</span> Ver PDF
            </a>
          )}
          {p.contenido && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-3">{p.contenido}</p>
          )}
          {isAdmin && (
            <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-500 hover:text-red-700 mt-2">
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function NuevaPoliticaModal({ onClose, onSaved, nextOrden }: { onClose: () => void; onSaved: () => void; nextOrden: number }) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("SALUD_SEGURIDAD");
  const [contenido, setContenido] = useState("");
  const [pdfMode, setPdfMode] = useState<"pdf" | "texto">("pdf");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let pdfUrl: string | null = null;

      if (pdfMode === "pdf" && pdfFile) {
        const fd = new FormData();
        fd.append("file", pdfFile);
        const uploadRes = await fetch("/api/politicas/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error((await uploadRes.json()).error ?? "Error subiendo PDF");
        pdfUrl = (await uploadRes.json()).url;
      }

      const res = await fetch("/api/politicas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, tipo, contenido: contenido || null, pdfUrl, orden: nextOrden }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error al guardar");
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Nueva política</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Ej: Política de Salud y Seguridad Ocupacional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contenido</label>
            <div className="flex gap-2 mb-3">
              {(["pdf", "texto"] as const).map(m => (
                <button key={m} type="button" onClick={() => setPdfMode(m)} className={`px-3 py-1 text-xs font-medium rounded-full border ${pdfMode === m ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 text-gray-600 hover:border-gray-400"}`}>
                  {m === "pdf" ? "📄 Subir PDF" : "✏️ Texto"}
                </button>
              ))}
            </div>
            {pdfMode === "pdf" ? (
              <div>
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors text-center">
                  {pdfFile ? `📄 ${pdfFile.name}` : "Haz clic para seleccionar el PDF"}
                </button>
              </div>
            ) : (
              <textarea value={contenido} onChange={e => setContenido(e.target.value)} rows={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Escribe el contenido de la política…" />
            )}
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PoliticasTab({ politicas, isAdmin, onReload }: { politicas: Politica[]; isAdmin: boolean; onReload: () => void }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-lg">
            <span className="text-base leading-none">+</span> Nueva política
          </button>
        </div>
      )}
      {politicas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm">No hay políticas cargadas aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {politicas.map(p => (
            <PoliticaCard key={p.id} p={p} isAdmin={isAdmin} onDelete={onReload} />
          ))}
        </div>
      )}
      {showModal && <NuevaPoliticaModal onClose={() => setShowModal(false)} onSaved={onReload} nextOrden={politicas.length} />}
    </div>
  );
}
