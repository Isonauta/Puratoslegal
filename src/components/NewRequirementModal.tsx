"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RESPONSABLES } from "./RequirementRow";

const AMBITOS = ["SST", "MA", "SGI", "GENERAL"];
const TIPOS_DOC = ["Ley", "Decreto Supremo", "Decreto", "Resolución", "Circular", "Norma Técnica", "Reglamento", "Otro"];

export function NewRequirementModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    tipoDocumento: "Ley",
    documentoNumero: "",
    nombreLey: "",
    organismo: "",
    ambito: "SST",
    articulo: "",
    titulo: "",
    requisitoTexto: "",
    responsable: "",
  });

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.titulo.trim() || !form.organismo.trim()) return;
    setBusy(true);
    const res = await fetch("/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setForm({ tipoDocumento: "Ley", documentoNumero: "", nombreLey: "", organismo: "", ambito: "SST", articulo: "", titulo: "", requisitoTexto: "", responsable: "" });
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        + Nueva legislación
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Nueva legislación</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Tipo de documento</label>
                  <select value={form.tipoDocumento} onChange={e => set("tipoDocumento", e.target.value)}
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50">
                    {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">N° (opcional)</label>
                  <input value={form.documentoNumero} onChange={e => set("documentoNumero", e.target.value)}
                    placeholder="ej. 20123"
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Nombre de la ley / decreto</label>
                <input value={form.nombreLey} onChange={e => set("nombreLey", e.target.value)}
                  placeholder="ej. Ley sobre accidentes del trabajo y enfermedades profesionales"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Organismo emisor *</label>
                  <input value={form.organismo} onChange={e => set("organismo", e.target.value)}
                    placeholder="ej. Ministerio del Trabajo"
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Ámbito</label>
                  <select value={form.ambito} onChange={e => set("ambito", e.target.value)}
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50">
                    {AMBITOS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Artículo</label>
                  <input value={form.articulo} onChange={e => set("articulo", e.target.value)}
                    placeholder="ej. 184"
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Responsable</label>
                  <select value={form.responsable} onChange={e => set("responsable", e.target.value)}
                    className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50">
                    <option value="">Sin asignar</option>
                    {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Título del requisito *</label>
                <input value={form.titulo} onChange={e => set("titulo", e.target.value)}
                  placeholder="ej. El empleador debe proteger eficazmente la vida y salud de los trabajadores"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Texto del requisito</label>
                <textarea rows={3} value={form.requisitoTexto} onChange={e => set("requisitoTexto", e.target.value)}
                  placeholder="Texto legal completo del artículo…"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50" />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button type="button" onClick={() => setOpen(false)}
                className="rounded border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
                Cancelar
              </button>
              <button type="button" disabled={busy || !form.titulo.trim() || !form.organismo.trim()} onClick={save}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {busy ? "Guardando…" : "Crear requisito"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
