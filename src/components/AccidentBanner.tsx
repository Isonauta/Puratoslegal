"use client";
import { useState } from "react";

type AreaData = { area: string; dias: number; desde: string };

type Props = {
  dias: number;
  desde: string;
  areas: AreaData[];
  isAdmin: boolean;
};

function colorClasses(dias: number) {
  if (dias >= 365) return { grad: "from-emerald-600 to-emerald-700", bar: "bg-emerald-300" };
  if (dias >= 100) return { grad: "from-green-600 to-green-700", bar: "bg-green-300" };
  if (dias >= 30)  return { grad: "from-blue-600 to-blue-700",  bar: "bg-blue-300" };
  return { grad: "from-amber-500 to-amber-600", bar: "bg-amber-300" };
}

function milestone(dias: number) {
  if (dias >= 365) return "¡Un año sin accidentes!";
  if (dias >= 100) return "¡Más de 100 días!";
  if (dias >= 30)  return "¡Más de un mes!";
  return null;
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

function calcDias(iso: string) {
  const desde = new Date(iso); desde.setHours(0,0,0,0);
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  return Math.floor((hoy.getTime() - desde.getTime()) / 86400000);
}

function ResetButton({ area, currentDate, onSaved }: { area: string | null; currentDate: string; onSaved: (newDate: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(currentDate);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const key = area ? `lastAccidentDate_${area}` : "lastAccidentDate";
    await fetch("/api/site-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: date }),
    });
    setSaving(false);
    setEditing(false);
    onSaved(date);
  }

  if (!editing) return (
    <button onClick={() => setEditing(true)} className="text-xs opacity-70 hover:opacity-100 underline underline-offset-2">
      Resetear
    </button>
  );

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        className="rounded border border-white/30 bg-white/20 px-1.5 py-0.5 text-xs text-white" />
      <button disabled={saving} onClick={save}
        className="rounded bg-white/20 px-2 py-0.5 text-xs font-medium hover:bg-white/30 disabled:opacity-50">
        {saving ? "…" : "✓"}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

function AreaRow({ a, isAdmin, onUpdate }: { a: AreaData; isAdmin: boolean; onUpdate: (area: string, date: string) => void }) {
  const { bar } = colorClasses(a.dias);
  const maxDias = 365;
  const pct = Math.min(100, (a.dias / maxDias) * 100);

  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0">
      <div className="w-28 shrink-0 text-xs font-medium opacity-90 truncate">{a.area}</div>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-right shrink-0 w-20">
        <span className="text-sm font-bold">{a.dias}</span>
        <span className="text-xs opacity-70 ml-1">días</span>
      </div>
      <div className="text-xs opacity-60 shrink-0 hidden sm:block w-24 text-right">{fmtDate(a.desde)}</div>
      {isAdmin && (
        <div className="shrink-0">
          <ResetButton area={a.area} currentDate={a.desde} onSaved={date => onUpdate(a.area, date)} />
        </div>
      )}
    </div>
  );
}

export function AccidentBanner({ dias: initialDias, desde: initialDesde, areas: initialAreas, isAdmin }: Props) {
  const [globalDias, setGlobalDias] = useState(initialDias);
  const [globalDesde, setGlobalDesde] = useState(initialDesde);
  const [areas, setAreas] = useState(initialAreas);
  const [expanded, setExpanded] = useState(false);

  const { grad } = colorClasses(globalDias);
  const ms = milestone(globalDias);

  // Área crítica = la que tuvo accidente más recientemente (menos días)
  const sorted = [...areas].sort((a, b) => a.dias - b.dias);
  const critica = sorted[0];
  const resto = sorted.slice(1);

  function updateArea(area: string, date: string) {
    setAreas(prev => prev.map(a => a.area === area ? { ...a, desde: date, dias: calcDias(date) } : a));
  }

  function updateGlobal(date: string) {
    setGlobalDesde(date);
    setGlobalDias(calcDias(date));
  }

  return (
    <div className={`rounded-xl bg-gradient-to-r ${grad} text-white shadow-sm overflow-hidden`}>
      {/* Cabecera global */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className="text-5xl font-black leading-none">{globalDias}</p>
            <p className="mt-0.5 text-sm font-medium opacity-80">días</p>
          </div>
          <div>
            <p className="text-lg font-bold">Sin accidentes con tiempo perdido</p>
            {ms && <p className="text-sm font-semibold opacity-90">{ms}</p>}
            <p className="mt-0.5 text-xs opacity-70">Desde el {fmtDate(globalDesde)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <ResetButton area={null} currentDate={globalDesde} onSaved={updateGlobal} />
          )}
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20 transition-colors">
            Por área
            <span className="text-xs">{expanded ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {/* Área crítica siempre visible */}
      {critica && (
        <div className="px-6 pb-3">
          <div className="bg-white/10 rounded-lg px-4 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Área con último accidente</span>
            </div>
            <AreaRow a={critica} isAdmin={isAdmin} onUpdate={updateArea} />
          </div>
        </div>
      )}

      {/* Resto colapsable */}
      {expanded && (
        <div className="px-6 pb-4">
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Todas las áreas</p>
            {sorted.map(a => (
              <AreaRow key={a.area} a={a} isAdmin={isAdmin} onUpdate={updateArea} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
