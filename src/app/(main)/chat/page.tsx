import { ChatWindow } from "@/components/ChatWindow";
import Link from "next/link";

export default function ChatPage() {
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
              Asistente especializado en la legislación aplicable a Puratos Chile
            </p>
          </div>
        </div>
      </header>
      <ChatWindow />
    </div>
  );
}
