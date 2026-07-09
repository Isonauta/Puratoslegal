"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-4xl">⚠️</p>
        <h1 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Base de datos temporalmente no disponible
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Supabase está experimentando un incidente técnico. El servicio volverá en breve.
          No se han perdido datos.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
