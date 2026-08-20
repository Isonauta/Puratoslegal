"use client";
import { useState } from "react";

type Video = { id: string; titulo: string; descripcion: string | null; youtubeUrl: string; orden: number; publicado: boolean; createdAt: string; updatedAt: string };

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

function VideoCard({ video, isAdmin, onDelete }: { video: Video; isAdmin: boolean; onDelete: () => void }) {
  const vid = youtubeId(video.youtubeUrl);
  const thumb = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null;
  const embedUrl = vid ? `https://www.youtube.com/embed/${vid}` : null;
  const [playing, setPlaying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("¿Eliminar este video?")) return;
    setDeleting(true);
    await fetch("/api/videos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: video.id }) });
    onDelete();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="aspect-video bg-gray-900 relative">
        {playing && embedUrl ? (
          <iframe src={`${embedUrl}?autoplay=1`} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
        ) : thumb ? (
          <button onClick={() => setPlaying(true)} className="w-full h-full relative group">
            <img src={thumb} alt={video.titulo} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
              <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl ml-1">▶</span>
              </div>
            </div>
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">URL inválida</div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">{video.titulo}</h3>
        {video.descripcion && <p className="text-xs text-gray-500">{video.descripcion}</p>}
      </div>
      {isAdmin && (
        <div className="px-4 pb-3">
          <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-500 hover:text-red-700">
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      )}
    </div>
  );
}

function NuevoVideoModal({ onClose, onSaved, nextOrden }: { onClose: () => void; onSaved: () => void; nextOrden: number }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descripcion: descripcion || null, youtubeUrl, orden: nextOrden }),
    });
    setSaving(false);
    if (res.ok) { onSaved(); onClose(); }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar"); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Agregar video</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Ej: Inducción de seguridad" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de YouTube *</label>
            <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} required type="url" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="https://www.youtube.com/watch?v=..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Breve descripción opcional" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
              {saving ? "Guardando…" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VideosTab({ videos, isAdmin, onReload }: { videos: Video[]; isAdmin: boolean; onReload: () => void }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-lg">
            <span className="text-base leading-none">+</span> Agregar video
          </button>
        </div>
      )}
      {videos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">▶</p>
          <p className="text-sm">No hay videos cargados aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(v => (
            <VideoCard key={v.id} video={v} isAdmin={isAdmin} onDelete={onReload} />
          ))}
        </div>
      )}
      {showModal && <NuevoVideoModal onClose={() => setShowModal(false)} onSaved={onReload} nextOrden={videos.length} />}
    </div>
  );
}
