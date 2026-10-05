"use client";

import { useState } from "react";
import LeviMascot from "./LeviMascot";
import { NEAR_MISS_AREAS, NEAR_MISS_CONSECUENCIAS, NEAR_MISS_DESCRIPCION_MAX } from "@/lib/nearMiss";

function todayLocalISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function NearMissForm() {
  const [fecha, setFecha] = useState(todayLocalISO());
  const [nombreReporta, setNombreReporta] = useState("");
  const [areaReporta, setAreaReporta] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [consecuencia, setConsecuencia] = useState("");
  const [medidaInmediata, setMedidaInmediata] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (medidaInmediata === null) {
      setError("Indica si se pueden tomar medidas de forma inmediata.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/near-miss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, nombreReporta, areaReporta, titulo, descripcion, consecuencia, medidaInmediata }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setEnviado(data.numero);
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo enviar el reporte. Intenta de nuevo.");
    }
  }

  if (enviado !== null) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto" style={{ width: 180, aspectRatio: "620 / 480" }}>
          <LeviMascot />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mt-2">¡Gracias por reportar!</h1>
        <p className="text-gray-600 mt-2 text-sm leading-relaxed">
          Hemos recibido tu Near Miss <span className="font-semibold">N° {enviado}</span>, te contestaremos a la brevedad.
        </p>
        <p className="text-gray-400 mt-4 text-xs">— Levi, Isosafe Chile</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reporte de Seguridad</h1>
        <p className="text-gray-500 mt-1 text-sm">Near Misses — Isosafe Chile</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
        <Field label="Fecha" required>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </Field>

        <Field label="Nombre de quién reporta" required>
          <input
            type="text"
            value={nombreReporta}
            onChange={(e) => setNombreReporta(e.target.value)}
            placeholder="Escriba su respuesta"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </Field>

        <Field label="Área de pertenencia de quién reporta" required>
          <RadioGroup name="areaReporta" value={areaReporta} onChange={setAreaReporta} options={NEAR_MISS_AREAS} />
        </Field>

        <Field label="Título" required>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Escriba su respuesta"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </Field>

        <Field label="Descripción" hint={`Máximo ${NEAR_MISS_DESCRIPCION_MAX} caracteres`} required>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value.slice(0, NEAR_MISS_DESCRIPCION_MAX))}
            placeholder="Escriba su respuesta"
            rows={3}
            maxLength={NEAR_MISS_DESCRIPCION_MAX}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            required
          />
          <p className="text-right text-xs text-gray-400 mt-1">{descripcion.length}/{NEAR_MISS_DESCRIPCION_MAX}</p>
        </Field>

        <Field label="Consecuencias" required>
          <RadioGroup name="consecuencia" value={consecuencia} onChange={setConsecuencia} options={NEAR_MISS_CONSECUENCIAS} />
        </Field>

        <Field label="¿Se pueden tomar medidas de forma inmediata?" required>
          <RadioGroup
            name="medidaInmediata"
            value={medidaInmediata === null ? "" : medidaInmediata ? "Sí" : "No"}
            onChange={(v) => setMedidaInmediata(v === "Sí")}
            options={["Sí", "No"]}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
        >
          {loading ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

function RadioGroup({ name, value, onChange, options }: { name: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="w-4 h-4 accent-red-600 shrink-0"
            required
          />
          <span className="text-sm text-gray-800">{opt}</span>
        </label>
      ))}
    </div>
  );
}
