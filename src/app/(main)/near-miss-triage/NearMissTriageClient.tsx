"use client";

import { useState } from "react";
import { NEAR_MISS_PRIORIDADES } from "@/lib/nearMiss";

interface NearMiss {
  id: string;
  numero: number;
  fecha: string;
  nombreReporta: string;
  areaReporta: string;
  titulo: string;
  descripcion: string;
  consecuencia: string;
  medidaInmediata: boolean;
  estado: string;
  prioridad: string | null;
  triagePor: string | null;
  triageComentario: string | null;
  triageFecha: string | null;
  createdAt: string;
}

const ESTADO_COLORS: Record<string, string> = {
  "Pendiente": "bg-red-100 text-red-700",
  "En triage": "bg-amber-100 text-amber-700",
  "Cerrado": "bg-green-100 text-green-700",
};

const PRIORIDAD_COLORS: Record<string, string> = {
  "Alta": "bg-red-50 text-red-600 border border-red-200",
  "Media": "bg-amber-50 text-amber-600 border border-amber-200",
  "Baja": "bg-green-50 text-green-600 border border-green-200",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

function DetailModal({ item, onClose, onUpdated }: { item: NearMiss; onClose: () => void; onUpdated: (nm: NearMiss) => void }) {
  const [prioridad, setPrioridad] = useState(item.prioridad ?? "");
  const [comentario, setComentario] = useState(item.triageComentario ?? "");
  const [saving, setSaving] = useState<string | null>(null);

  async function send(accion: string) {
    setSaving(accion);
    const res = await fetch("/api/near-miss", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, accion, prioridad: prioridad || undefined, comentario }),
    });
    setSaving(null);
    if (res.ok) {
      const data = await res.json();
      onUpdated(data);
      if (accion === "cerrar") onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Near Miss N° {item.numero}</h2>
            <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLORS[item.estado]}`}>
              {item.estado}
            </span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl">×</button>
        </div>

        <div className="px-6 py-4 space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium text-zinc-500">Título</p>
            <p className="text-zinc-900 font-medium">{item.titulo}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Descripción</p>
            <p className="text-zinc-700">{item.descripcion}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-zinc-500">Fecha</p>
              <p className="text-zinc-700">{fmt(item.fecha)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Área</p>
              <p className="text-zinc-700">{item.areaReporta}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Reportado por</p>
              <p className="text-zinc-700">{item.nombreReporta}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">¿Medidas inmediatas?</p>
              <p className="text-zinc-700">{item.medidaInmediata ? "Sí" : "No"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500">Consecuencias</p>
            <p className="text-zinc-700">{item.consecuencia}</p>
          </div>

          {item.triagePor && (
            <p className="text-xs text-zinc-400 pt-1">Tomado por {item.triagePor} el {fmt(item.triageFecha)}</p>
          )}

          {item.estado !== "Cerrado" && (
            <div className="border-t border-zinc-100 pt-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600">Prioridad</label>
                <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none">
                  <option value="">Sin asignar</option>
                  {NEAR_MISS_PRIORIDADES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600">Comentario de triage</label>
                <textarea rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none resize-none" />
              </div>
            </div>
          )}
        </div>

        {item.estado !== "Cerrado" && (
          <div className="flex justify-end gap-3 px-6 pb-5 pt-2">
            {item.estado === "Pendiente" && (
              <button onClick={() => send("tomar")} disabled={saving !== null}
                className="px-4 py-2 text-sm font-semibold border border-[#C41230] text-[#C41230] rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors">
                {saving === "tomar" ? "Tomando..." : "Tomar caso"}
              </button>
            )}
            {item.estado === "En triage" && (
              <button onClick={() => send("actualizar")} disabled={saving !== null}
                className="px-4 py-2 text-sm font-semibold border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 disabled:opacity-60 transition-colors">
                {saving === "actualizar" ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
            <button onClick={() => send("cerrar")} disabled={saving !== null}
              className="px-5 py-2 text-sm font-semibold bg-[#C41230] text-white rounded-lg hover:bg-[#a30f26] disabled:opacity-60 transition-colors">
              {saving === "cerrar" ? "Cerrando..." : "Cerrar caso"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NearMissTriageClient({ items: initial }: { items: NearMiss[] }) {
  const [items, setItems] = useState<NearMiss[]>(initial);
  const [selected, setSelected] = useState<NearMiss | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("Todas");

  const byEstado = (e: string) => items.filter((n) => n.estado === e).length;
  const pendientes = byEstado("Pendiente");
  const enTriage = byEstado("En triage");
  const cerrados = byEstado("Cerrado");

  const filtered = items.filter((n) => filtroEstado === "Todas" || n.estado === filtroEstado);

  function onUpdated(nm: NearMiss) {
    setItems((prev) => prev.map((x) => (x.id === nm.id ? nm : x)));
    setSelected(nm);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Near Misses — Triage</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Reportes recibidos vía QR de planta. Visible solo para el equipo de triage asignado.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-2xl font-bold text-red-600">{pendientes}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Pendientes</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-2xl font-bold text-amber-600">{enTriage}</p>
          <p className="text-xs text-zinc-500 mt-0.5">En triage</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-2xl font-bold text-green-600">{cerrados}</p>
          <p className="text-xs text-zinc-500 mt-0.5">Cerrados</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["Todas", "Pendiente", "En triage", "Cerrado"].map((e) => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filtroEstado === e ? "bg-[#C41230] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}>
            {e}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-zinc-400 py-8 text-center">No hay reportes en este estado.</p>
        )}
        {filtered.map((n) => (
          <button key={n.id} onClick={() => setSelected(n)}
            className="w-full text-left bg-white border border-zinc-200 rounded-xl px-4 py-3 hover:border-[#C41230]/40 hover:shadow-sm transition-all flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400">N° {n.numero}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLORS[n.estado]}`}>{n.estado}</span>
                {n.prioridad && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORIDAD_COLORS[n.prioridad]}`}>{n.prioridad}</span>
                )}
              </div>
              <p className="text-sm font-medium text-zinc-900 truncate mt-1">{n.titulo}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{n.areaReporta} · {fmt(n.fecha)}</p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)} onUpdated={onUpdated} />
      )}
    </div>
  );
}
