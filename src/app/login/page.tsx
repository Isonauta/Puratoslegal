"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

const MODULES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Permisos de Trabajo",
    desc: "Emisión y control de PTS desde terreno, incluso sin conexión.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Requisitos Legales",
    desc: "Seguimiento de cumplimiento normativo por área y proceso.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Accidentabilidad DS67",
    desc: "Indicadores IF, IG e IA por área según Decreto Supremo 67.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Planes de Acción",
    desc: "Gestión de actividades SST y Medio Ambiente con seguimiento en tiempo real.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: "Asistente IA",
    desc: "Consultas legales y normativas respondidas por inteligencia artificial.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Manual del SIG",
    desc: "Documentación del sistema integrado de gestión siempre disponible.",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push(from);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Error al iniciar sesión");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-[#C41230] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <span className="text-white font-bold text-lg leading-none">Pura<span className="opacity-80">safe</span></span>
            <p className="text-white/60 text-[10px] uppercase tracking-widest leading-none mt-0.5">Puratos Chile</p>
          </div>
        </div>
        <span className="hidden sm:block text-white/70 text-xs">Sistema Integrado de Gestión</span>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left — hero */}
        <div className="flex-1 bg-zinc-50 px-8 py-12 lg:px-16 lg:py-20 flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C41230] mb-3">Plataforma de cumplimiento legal</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-zinc-900 leading-tight mb-4">
            Seguridad y cumplimiento<br className="hidden sm:block" /> en un solo lugar
          </h1>
          <p className="text-zinc-500 text-base mb-10 max-w-md">
            Gestiona permisos de trabajo, indicadores de accidentabilidad, planes de acción y requisitos legales desde cualquier dispositivo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            {MODULES.map((m) => (
              <div key={m.title} className="flex gap-3 bg-white rounded-xl border border-zinc-100 p-4 shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-red-50 text-[#C41230] flex items-center justify-center shrink-0">
                  {m.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">{m.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-snug">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — login form */}
        <div className="w-full lg:w-96 shrink-0 flex items-center justify-center px-6 py-12 bg-white border-t lg:border-t-0 lg:border-l border-zinc-100">
          <div className="w-full max-w-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-1">Bienvenido</h2>
            <p className="text-sm text-zinc-400 mb-8">Ingresa con tu cuenta corporativa</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="usuario@puratos.com"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 transition-colors"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#C41230] py-2.5 text-sm font-semibold text-white hover:bg-[#a30f26] disabled:opacity-60 transition-colors mt-2"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-zinc-300">
              Purasafe · {new Date().getFullYear()} · Puratos Chile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
