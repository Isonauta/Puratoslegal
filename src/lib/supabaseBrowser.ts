"use client";

import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | null = null;

// Sube directo desde el navegador al bucket de Supabase Storage, sin pasar
// por nuestro propio servidor (evita el límite de tamaño de las funciones
// serverless de Vercel). La "anon key" es pública por diseño: el bucket
// "documentos" solo permite lo que autoricen sus políticas RLS.
export function getSupabaseBrowser() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    client = createClient(url, anonKey);
  }
  return client;
}

export const DOCUMENTOS_BUCKET = "documentos";
