"use client";

import { useState } from "react";
import Link from "next/link";

type Plan = {
  id: string;
  titulo: string;
  responsable: string | null;
  status: string;
  fechaEjecucion: Date | null;
  tipoDocumento: string | null;
  documentoNumero: string | null;
  legalRequirement: { numero: number; ambito: string } | null;
};

type Permit = {
  id: string;
  numero: number;
  nombre: string;
  categoria: string;
  proximoVencimiento: Date | null;
  estadoSugerido: string | null;
};

type Event = {
  id: string;
  date: Date;
  type: "plan" | "permit";
  label: string;
  sublabel: string;
  status: string;
  linkHref?: string;
};

const STATUS_COLOR: Record<string, string> = {
  ABIERTO:  "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  EN_CURSO: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  VENCIDO:  "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  CERRADO:  "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  permit_ok:     "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  permit_warn:   "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  permit_urgent: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_CURSO: "En curso",
  VENCIDO: "Vencido",
  CERRADO: "Cerrado",
};

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DOW = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

function permitStatus(p: Permit, today: Date): string {
  if (!p.proximoVencimiento) return "permit_ok";
  const diff = (new Date(p.proximoVencimiento).getTime() - today.getTime()) / 86400000;
  if (diff < 0) return "permit_urgent";
  if (diff <= 30) return "permit_warn";
  return "permit_ok";
}

function toEvents(plans: Plan[], permits: Permit[], today: Date): Event[] {
  const evts: Event[] = [];
  for (const p of plans) {
    if (!p.fechaEjecucion) continue;
    evts.push({
      id: `plan-${p.id}`,
      date: new Date(p.fechaEjecucion),
      type: "plan",
      label: p.titulo,
      sublabel: p.responsable ?? "Sin responsable",
      status: p.status,
      linkHref: "/planes-accion",
    });
  }
  for (const p of permits) {
    if (!p.proximoVencimiento) continue;
    evts.push({
      id: `permit-${p.id}`,
      date: new Date(p.proximoVencimiento),
      type: "permit",
      label: p.nombre,
      sublabel: p.categoria,
      status: permitStatus(p, today),
    });
  }
  return evts;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(year: number, month: number) {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first day offset (0=Mon ... 6=Sun)
function firstDayOffset(year: number, month: number) {
  const d = new Date(year, month, 1).getDay(); // 0=Sun
  return (d + 6) % 7;
}

export function CalendarView({ plans, permits }: { plans: Plan[]; permits: Permit[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date | null>(null);
  const [tab, setTab] = useState<"calendar" | "list">("calendar");

  const events = toEvents(plans, permits, today);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const days = daysInMonth(viewYear, viewMonth);
  const offset = firstDayOffset(viewYear, viewMonth);
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  function eventsForDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    return events.filter(e => isSameDay(e.date, d));
  }

  const selectedEvents = selected ? events.filter(e => isSameDay(e.date, selected)) : [];

  // Upcoming list — next 90 days
  const upcoming = events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 50);

  const overdue = events.filter(e => e.date < today && e.type === "plan" && e.status !== "CERRADO");

  function formatDate(d: Date) {
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }

  function daysUntil(d: Date) {
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "hoy";
    if (diff === 1) return "mañana";
    if (diff < 0) return `hace ${-diff} día${-diff !== 1 ? "s" : ""}`;
    return `en ${diff} día${diff !== 1 ? "s" : ""}`;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {(["calendar", "list"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {t === "calendar" ? "Calendario" : "Lista"}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-zinc-400 dark:text-zinc-500">
          {events.length} evento{events.length !== 1 ? "s" : ""} con fecha
        </span>
      </div>

      {tab === "calendar" && (
        <div className="space-y-4">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              ◀
            </button>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <button type="button" onClick={nextMonth} className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              ▶
            </button>
          </div>

          {/* Grid */}
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            {/* DOW headers */}
            <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
              {DOW.map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">{d}</div>
              ))}
            </div>
            {/* Cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="min-h-[72px] border-b border-r border-zinc-100 dark:border-zinc-800/60 last:border-r-0" />;
                const evts = eventsForDay(day);
                const cellDate = new Date(viewYear, viewMonth, day);
                const isToday = isSameDay(cellDate, today);
                const isSelected = selected && isSameDay(cellDate, selected);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : cellDate)}
                    className={`min-h-[72px] p-1.5 text-left border-b border-r border-zinc-100 dark:border-zinc-800/60 last:border-r-0 transition-colors ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday
                        ? "bg-blue-600 text-white"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}>
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {evts.slice(0, 3).map(e => (
                        <div
                          key={e.id}
                          className={`truncate rounded px-1 text-[10px] font-medium leading-tight ${STATUS_COLOR[e.status]}`}
                        >
                          {e.type === "permit" ? "🔑 " : "📋 "}{e.label}
                        </div>
                      ))}
                      {evts.length > 3 && (
                        <div className="text-[10px] text-zinc-400">+{evts.length - 3} más</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day panel */}
          {selected && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {formatDate(selected)}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-zinc-400">Sin eventos este día.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(e => (
                    <EventCard key={e.id} event={e} daysUntil={daysUntil(e.date)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "list" && (
        <div className="space-y-6">
          {/* Vencidos */}
          {overdue.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-500 dark:text-red-400">
                ✗ Vencidos — {overdue.length}
              </h2>
              <div className="space-y-2">
                {overdue.map(e => (
                  <EventCard key={e.id} event={e} daysUntil={daysUntil(e.date)} />
                ))}
              </div>
            </section>
          )}

          {/* Próximos */}
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Próximos vencimientos
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-zinc-400">Sin eventos próximos.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(e => (
                  <EventCard key={e.id} event={e} daysUntil={daysUntil(e.date)} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">Referencias:</span>
        {[
          { color: STATUS_COLOR.ABIERTO, label: "Plan abierto" },
          { color: STATUS_COLOR.EN_CURSO, label: "Plan en curso" },
          { color: STATUS_COLOR.VENCIDO, label: "Plan vencido" },
          { color: STATUS_COLOR.permit_warn, label: "Permiso próximo" },
          { color: STATUS_COLOR.permit_urgent, label: "Permiso vencido" },
        ].map(l => (
          <span key={l.label} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${l.color}`}>
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function EventCard({ event, daysUntil }: { event: Event; daysUntil: string }) {
  const isOverdue = event.date < new Date();
  return (
    <div className={`flex flex-wrap items-start gap-3 rounded-lg border p-3 ${
      isOverdue && event.type === "plan"
        ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    }`}>
      <span className="text-lg">{event.type === "permit" ? "🔑" : "📋"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{event.label}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{event.sublabel}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[event.status]}`}>
          {STATUS_LABEL[event.status] ?? event.status}
        </span>
        <span className={`text-xs ${isOverdue ? "text-red-600 dark:text-red-400 font-medium" : "text-zinc-400 dark:text-zinc-500"}`}>
          {daysUntil}
        </span>
      </div>
    </div>
  );
}
