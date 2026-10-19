"use client";

import { useState } from "react";

const OVERLAYS = [
  { key: "wind", label: "Viento" },
  { key: "rain", label: "Lluvia" },
  { key: "temp", label: "Temperatura" },
] as const;

export default function WindyMap({ lat, lon, nombre }: { lat: number; lon: number; nombre: string }) {
  const [overlay, setOverlay] = useState<(typeof OVERLAYS)[number]["key"]>("wind");

  const src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&zoom=9&level=surface&overlay=${overlay}&menu=&message=true&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

  return (
    <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-b border-zinc-100">
        <div className="flex gap-1">
          {OVERLAYS.map((o) => (
            <button key={o.key} onClick={() => setOverlay(o.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${overlay === o.key ? "bg-zinc-800 text-white border-zinc-800" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"}`}>
              {o.label}
            </button>
          ))}
        </div>
        <a href={`https://www.windy.com/?${overlay},${lat},${lon},9`} target="_blank" rel="noreferrer"
          className="text-xs text-zinc-400 hover:text-zinc-600">
          Abrir en Windy ↗
        </a>
      </div>
      <iframe
        title={`Mapa meteorológico — ${nombre}`}
        src={src}
        className="w-full h-[420px] border-0"
        loading="lazy"
      />
      <p className="px-4 py-2 text-[11px] text-zinc-400 border-t border-zinc-100">
        Mapa y pronóstico externos de Windy.com — {nombre}. Vista de consulta; no reemplaza las alertas oficiales DMC/SENAPRED.
      </p>
    </div>
  );
}
