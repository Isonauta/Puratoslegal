"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaProvider() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState(0);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Registrar service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/pts" })
        .then((reg) => {
          console.log("[SW] Registrado", reg.scope);
          // Escuchar mensajes del SW (cola offline)
          navigator.serviceWorker.addEventListener("message", (e) => {
            if (e.data?.type === "OFFLINE_QUEUE_COUNT") {
              setOfflineQueue(e.data.count);
            }
          });
          // Intentar sync al reconectar
          window.addEventListener("online", () => {
            if ("sync" in reg) {
              (reg as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } })
                .sync.register("pts-sync").catch(() => {});
            }
          });
        })
        .catch((err) => console.warn("[SW] Error al registrar:", err));
    }

    // Detectar estado de red
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Capturar evento de instalación
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Detectar si ya está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setInstalled(true);
    }
  }

  return (
    <>
      {/* Banner sin red */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-center text-sm py-2 px-4 font-medium">
          Sin conexión · Los PTS creados se sincronizarán al reconectar
          {offlineQueue > 0 && ` (${offlineQueue} pendiente${offlineQueue > 1 ? "s" : ""})`}
        </div>
      )}

      {/* Banner de instalación */}
      {installPrompt && !installed && (
        <div className="fixed bottom-4 inset-x-4 z-50 bg-white border border-zinc-200 rounded-2xl shadow-xl p-4 flex items-center gap-3 md:max-w-sm md:left-auto md:right-4">
          <div className="w-10 h-10 rounded-xl bg-[#C41230] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900">Instalar Purasafe PTS</p>
            <p className="text-xs text-zinc-500">Úsalo en terreno sin navegador</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setInstallPrompt(null)}
              className="text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstall}
              className="text-xs font-semibold bg-[#C41230] text-white rounded-lg px-3 py-1.5 hover:bg-[#a30f26] transition-colors"
            >
              Instalar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
