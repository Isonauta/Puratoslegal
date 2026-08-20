"use client";
import { useState } from "react";
import NoticiasTab from "./tabs/NoticiasTab";
import VideosTab from "./tabs/VideosTab";
import PoliticasTab from "./tabs/PoliticasTab";
import TerminosTab from "./tabs/TerminosTab";

type Noticia = { id: string; titulo: string; contenido: string; categoria: string | null; autorNombre: string; destacado: boolean; createdAt: string };
type Video = { id: string; titulo: string; descripcion: string | null; youtubeUrl: string; orden: number; publicado: boolean; createdAt: string; updatedAt: string };
type Politica = { id: string; titulo: string; tipo: string; contenido: string | null; pdfUrl: string | null; publicado: boolean; orden: number; createdAt: string; updatedAt: string };
type Termino = { id: string; termino: string; definicion: string; orden: number; createdAt: string; updatedAt: string };

const TABS = [
  { key: "noticias", label: "Comunicados", icon: "📢" },
  { key: "videos", label: "Videos", icon: "▶" },
  { key: "politicas", label: "Políticas", icon: "📄" },
  { key: "terminos", label: "Términos", icon: "📖" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function NoticiasHub({
  noticias: initialNoticias,
  videos: initialVideos,
  politicas: initialPoliticas,
  terminos: initialTerminos,
  isAdmin,
}: {
  noticias: Noticia[];
  videos: Video[];
  politicas: Politica[];
  terminos: Termino[];
  isAdmin: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("noticias");
  const [noticias, setNoticias] = useState(initialNoticias);
  const [videos, setVideos] = useState(initialVideos);
  const [politicas, setPoliticas] = useState(initialPoliticas);
  const [terminos, setTerminos] = useState(initialTerminos);

  async function reload(section: "noticias" | "videos" | "politicas" | "terminos") {
    const res = await fetch(`/api/${section}`);
    if (!res.ok) return;
    const data = await res.json();
    if (section === "noticias") setNoticias(data);
    if (section === "videos") setVideos(data);
    if (section === "politicas") setPoliticas(data);
    if (section === "terminos") setTerminos(data);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">PuraSafe te informa</h1>
        <p className="text-sm text-gray-500 mt-1">Comunicados, videos, políticas y glosario de la planta</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "noticias" && (
        <NoticiasTab noticias={noticias} isAdmin={isAdmin} onReload={() => reload("noticias")} />
      )}
      {tab === "videos" && (
        <VideosTab videos={videos} isAdmin={isAdmin} onReload={() => reload("videos")} />
      )}
      {tab === "politicas" && (
        <PoliticasTab politicas={politicas} isAdmin={isAdmin} onReload={() => reload("politicas")} />
      )}
      {tab === "terminos" && (
        <TerminosTab terminos={terminos} isAdmin={isAdmin} onReload={() => reload("terminos")} />
      )}
    </div>
  );
}
