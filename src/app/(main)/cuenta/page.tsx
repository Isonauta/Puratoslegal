"use client";

import { useState } from "react";

export default function CuentaPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      setError(data.error ?? "No se pudo cambiar la contraseña");
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Mi cuenta</h1>
      <p className="text-sm text-zinc-400 mb-8">Cambia tu contraseña de acceso</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
            Contraseña actual
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
            Contraseña nueva
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 transition-colors"
          />
          <p className="text-[11px] text-zinc-400 mt-1">Mínimo 8 caracteres</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
            Confirmar contraseña nueva
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 transition-colors"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-400">
            Contraseña actualizada correctamente.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#C41230] py-2.5 text-sm font-semibold text-white hover:bg-[#a30f26] disabled:opacity-60 transition-colors mt-2"
        >
          {loading ? "Guardando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}
