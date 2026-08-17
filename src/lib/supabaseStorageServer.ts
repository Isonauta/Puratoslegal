import { DOCUMENTOS_BUCKET } from "@/lib/supabaseBrowser";

// Borra el archivo del bucket cuando se elimina el registro del documento.
// Usa la misma anon key pública (protegida por las políticas RLS del
// bucket "documentos"), llamada aquí desde el servidor.
export async function deleteStorageObject(storagePath: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return;

  await fetch(`${url}/storage/v1/object/${DOCUMENTOS_BUCKET}/${storagePath}`, {
    method: "DELETE",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });
}
