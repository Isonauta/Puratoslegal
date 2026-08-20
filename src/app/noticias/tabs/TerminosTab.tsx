"use client";
import { useState } from "react";

type Termino = { id: string; termino: string; definicion: string; orden: number; createdAt: string; updatedAt: string };

function NuevoTerminoModal({ onClose, onSaved, nextOrden }: { onClose: () => void; onSaved: () => void; nextOrden: number }) {
  const [termino, setTermino] = useState("");
  const [definicion, setDefinicion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/terminos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termino, definicion, orden: nextOrden }),
    });
    setSaving(false);
    if (res.ok) { onSaved(); onClose(); }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar"); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Nuevo término</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Término *</label>
            <input value={termino} onChange={e => setTermino(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Ej: EPP, Peligro, Riesgo…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Definición *</label>
            <textarea value={definicion} onChange={e => setDefinicion(e.target.value)} required rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Escribe la definición…" />
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

export default function TerminosTab({ terminos, isAdmin, onReload }: { terminos: Termino[]; isAdmin: boolean; onReload: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = terminos.filter(t =>
    t.termino.toLowerCase().includes(search.toLowerCase()) ||
    t.definicion.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este término?")) return;
    setDeletingId(id);
    await fetch("/api/terminos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setDeletingId(null);
    onReload();
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar término…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-lg whitespace-nowrap">
            <span className="text-base leading-none">+</span> Nuevo término
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-sm">{search ? "Sin resultados para esa búsqueda." : "No hay términos cargados aún."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-900">{t.termino}</span>
                <p className="text-sm text-gray-600 mt-0.5">{t.definicion}</p>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="text-xs text-red-400 hover:text-red-600 self-start mt-0.5 shrink-0">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && <NuevoTerminoModal onClose={() => setShowModal(false)} onSaved={onReload} nextOrden={terminos.length} />}
    </div>
  );
}
