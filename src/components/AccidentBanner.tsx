"use client";

import { useState } from "react";

type Props = {
  dias: number;
  desde: string;
  isAdmin: boolean;
};

export function AccidentBanner({ dias, desde, isAdmin }: Props) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(desde);
  const [saving, setSaving] = useState(false);
  const [localDias, setLocalDias] = useState(dias);
  const [localDesde, setLocalDesde] = useState(desde);

  const color =
    localDias >= 365 ? "from-emerald-600 to-emerald-700"
    : localDias >= 100 ? "from-green-600 to-green-700"
    : localDias >= 30  ? "from-blue-600 to-blue-700"
    : "from-amber-500 to-amber-600";

  const milestone =
    localDias >= 365 ? "¡Un año sin accidentes!" :
    localDias >= 100 ? "¡Más de 100 días!" :
    localDias >= 30  ? "¡Más de un mes!" : null;

  async function save() {
    setSaving(true);
    await fetch("/api/site-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "lastAccidentDate", value: date }),
    });
    const d = new Date(date);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const newDias = Math.floor((hoy.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    setLocalDias(newDias);
    setLocalDesde(date);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className={`rounded-xl bg-gradient-to-r ${color} px-6 py-5 text-white shadow-sm`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className="text-5xl font-black leading-none">{localDias}</p>
            <p className="mt-0.5 text-sm font-medium opacity-80">días</p>
          </div>
          <div>
            <p className="text-lg font-bold">Sin accidentes con tiempo perdido</p>
            {milestone && <p className="text-sm font-semibold opacity-90">{milestone}</p>}
            <p className="mt-0.5 text-xs opacity-70">
              Desde el {new Date(localDesde + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="shrink-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="rounded border border-white/30 bg-white/20 px-2 py-1 text-sm text-white placeholder-white/60"
                />
                <button disabled={saving} onClick={save}
                  className="rounded bg-white/20 px-3 py-1 text-sm font-medium hover:bg-white/30 disabled:opacity-50">
                  {saving ? "…" : "Guardar"}
                </button>
                <button onClick={() => setEditing(false)} className="text-sm opacity-70 hover:opacity-100">✕</button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)}
                className="rounded border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20">
                Resetear fecha
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
