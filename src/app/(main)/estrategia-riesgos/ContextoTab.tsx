"use client";

import { useState } from "react";

export interface Contexto {
  rubro: string;
  ubicaciones: string;
  tipoClientes: string;
  mercado: string;
  adicional: string;
}

const CAMPOS: { key: keyof Contexto; label: string; rows: number }[] = [
  { key: "rubro", label: "Rubro / Actividad", rows: 2 },
  { key: "ubicaciones", label: "Ubicaciones", rows: 2 },
  { key: "tipoClientes", label: "Tipo de clientes", rows: 2 },
  { key: "mercado", label: "Mercado / Sector", rows: 2 },
  { key: "adicional", label: "Contexto adicional", rows: 3 },
];

export default function ContextoTab({ contexto: initial, isAdmin, onChanged }: {
  contexto: Contexto; isAdmin: boolean; onChanged: (c: Contexto) => void;
}) {
  const [form, setForm] = useState<Contexto>(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function handleBlur(key: keyof Contexto) {
    if (!isAdmin) return;
    if (form[key] === initial[key] && form[key] === "") return;
    setSaving(key);
    const res = await fetch("/api/site-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: `contexto.${key}`, value: form[key] }),
    });
    setSaving(null);
    if (res.ok) {
      onChanged(form);
      setSaved(key);
      setTimeout(() => setSaved((s) => (s === key ? null : s)), 1500);
    }
  }

  const inp = "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none disabled:bg-zinc-50 disabled:text-zinc-500";
  const lbl = "block text-xs font-medium text-zinc-600 mb-1 uppercase tracking-wide";

  return (
    <div className="space-y-4">
      <div className="bg-white border border-zinc-100 rounded-xl p-5 space-y-4">
        <p className="text-sm font-semibold text-zinc-800">Contexto de la empresa</p>
        {CAMPOS.map(({ key, label, rows }) => (
          <div key={key}>
            <label className={lbl}>
              {label}
              {saving === key && <span className="ml-2 normal-case text-zinc-400">guardando…</span>}
              {saved === key && <span className="ml-2 normal-case text-emerald-600">✓ guardado</span>}
            </label>
            <textarea
              className={inp}
              rows={rows}
              disabled={!isAdmin}
              value={form[key]}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              onBlur={() => handleBlur(key)}
            />
          </div>
        ))}
        {!isAdmin && <p className="text-xs text-zinc-400">Solo un administrador puede editar el contexto.</p>}
      </div>
    </div>
  );
}
