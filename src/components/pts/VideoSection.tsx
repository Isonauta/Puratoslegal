"use client";
import { useState } from "react";

const videos = [
  {
    title: "Introducción a la SST",
    description: "Conceptos fundamentales de Seguridad y Salud en el Trabajo.",
    youtubeId: "15RA313884s",
  },
  {
    title: "Qué es un Permiso de Trabajo Seguro",
    description: "Aprende a identificar y aplicar procedimientos seguros en tu área.",
    youtubeId: "muTmWODczjU",
  },
  {
    title: "Pasos para aplicar un PTS",
    description: "Guía paso a paso para completar un Permiso de Trabajo Seguro.",
    youtubeId: "OHbcankLgb8",
  },
];

function VideoCard({ title, description, youtubeId }: { title: string; description: string; youtubeId: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      <div className="relative bg-gray-100 aspect-video">
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full group"
            aria-label={`Reproducir: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-14 h-14 rounded-full bg-[#C41230] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1">
        <p className="font-semibold text-sm text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export default function VideoSection() {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        ¿Qué es un Permiso de Trabajo Seguro?
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {videos.map((v) => (
          <VideoCard key={v.youtubeId} {...v} />
        ))}
      </div>
    </section>
  );
}
