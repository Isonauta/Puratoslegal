"use client";
import { useState } from "react";

type Noticia = { id: string; titulo: string; contenido: string; categoria: string | null; autorNombre: string; destacado: boolean; createdAt: string };

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

function NuevaNoticiaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [categoria, setCategoria] = useState("");
  const [destacado, setDestacado] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/noticias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, contenido, categoria: categoria || null, destacado }),
    });
    setSaving(false);
    if (res.ok) { onSaved(); onClose(); }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar"); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Nueva noticia</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Ej: Simulacro de evacuación este viernes" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <input value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Ej: Seguridad, Calidad, RRHH…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
            <textarea value={contenido} onChange={e => setContenido(e.target.value)} required rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Escribe el contenido…" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={destacado} onChange={e => setDestacado(e.target.checked)} className="rounded" />
            Marcar como destacada
          </label>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
              {saving ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NoticiasTab({ noticias, isAdmin, onReload }: { noticias: Noticia[]; isAdmin: boolean; onReload: () => void }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-lg">
            <span className="text-base leading-none">+</span> Nueva noticia
          </button>
        </div>
      )}
      {noticias.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">No hay noticias publicadas aún.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {noticias.map(n => (
            <article key={n.id} className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-2 ${n.destacado ? "border-red-300 ring-1 ring-red-200" : "border-gray-200"}`}>
              {n.destacado && <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full w-fit">★ Destacado</span>}
              {n.categoria && <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{n.categoria}</span>}
              <h2 className="text-base font-semibold text-gray-900 leading-snug">{n.titulo}</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.contenido}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                <span>{formatFecha(n.createdAt)}</span>
                <span>·</span>
                <span>{n.autorNombre}</span>
              </div>
            </article>
          ))}
        </div>
      )}
      {showModal && <NuevaNoticiaModal onClose={() => setShowModal(false)} onSaved={onReload} />}
    </div>
  );
}
