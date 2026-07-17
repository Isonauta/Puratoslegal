"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blank line → spacer
    if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Bullet list item
    if (/^[-*]\s/.test(line)) {
      elements.push(
        <div key={key++} className="flex gap-2 leading-relaxed">
          <span className="mt-px shrink-0 text-zinc-400">·</span>
          <span>{inlineParse(line.replace(/^[-*]\s/, ""))}</span>
        </div>
      );
      continue;
    }

    // Heading (##)
    if (/^#{1,3}\s/.test(line)) {
      elements.push(
        <p key={key++} className="font-semibold leading-relaxed">
          {inlineParse(line.replace(/^#{1,3}\s/, ""))}
        </p>
      );
      continue;
    }

    // Normal paragraph
    elements.push(<p key={key++} className="leading-relaxed">{inlineParse(line)}</p>);
  }

  return <>{elements}</>;
}

function inlineParse(text: string): React.ReactNode {
  // Split on **bold** patterns
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part)
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  );
}

const SUGGESTIONS = [
  "¿Qué dice la normativa sobre RIOHS?",
  "¿Qué requisitos de SST están pendientes?",
  "¿Qué necesito para cumplir con el DS 40?",
  "¿Cuáles son los requisitos medioambientales?",
];

export function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiMissing, setApiMissing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setApiMissing(false);

    const placeholder: Message = { role: "assistant", content: "" };
    setMessages([...next, placeholder]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (res.status === 503) {
        setApiMissing(true);
        setMessages(next);
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: accumulated }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Error al conectar con el asistente. Intenta de nuevo." }]);
    }

    setLoading(false);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && (
            <div className="space-y-6 text-center">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-2xl">⚖️</p>
                <p className="mt-2 font-medium text-zinc-800 dark:text-zinc-100">
                  Consulta sobre legislación de Puratos
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Pregunta sobre requisitos legales, artículos específicos o estado de cumplimiento.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left text-sm text-zinc-700 hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {apiMissing && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <p className="font-medium">API de Anthropic no configurada</p>
              <p className="mt-1">
                Agrega <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">ANTHROPIC_API_KEY</code> en las variables de entorno de Vercel para activar el asistente.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white leading-relaxed"
                    : "border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                }`}
              >
                {m.role === "user" ? (
                  m.content
                ) : m.content ? (
                  renderMarkdown(m.content)
                ) : loading && i === messages.length - 1 ? (
                  <span className="inline-flex gap-1 py-1">
                    <span className="animate-bounce">·</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>·</span>
                    <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>·</span>
                  </span>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-2xl items-end gap-3">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Escribe tu consulta legal…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:border-blue-400 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {loading ? "…" : "Enviar"}
          </button>
        </div>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-zinc-400">
          Solo responde sobre legislación aplicable a Puratos Chile · Enter para enviar
        </p>
      </div>
    </div>
  );
}
