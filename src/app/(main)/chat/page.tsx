"use client";

import { ChatWindow } from "@/components/ChatWindow";
import Link from "next/link";
import { useState } from "react";

export default function ChatPage() {
  const [chatKey, setChatKey] = useState(0);

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Volver al dashboard
            </Link>
            <h1 className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Conversa con Purasafe
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Asistente SIG de Puratos Chile — seguridad, medio ambiente, calidad y más
            </p>
          </div>
          <button
            type="button"
            onClick={() => setChatKey((k) => k + 1)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Nueva conversación
          </button>
        </div>
      </header>
      <ChatWindow key={chatKey} />
    </div>
  );
}
