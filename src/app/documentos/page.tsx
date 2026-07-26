import Link from "next/link";
import { getAllDocumentos } from "@/lib/queries";
import { getSession } from "@/lib/auth";
import { DocumentosManager } from "@/components/DocumentosManager";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  const [documentos, session] = await Promise.all([getAllDocumentos(), getSession()]);

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← Volver al dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Documentos</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {documentos.length} documento{documentos.length === 1 ? "" : "s"} · procedimientos, matrices y registros
          del SGI, ordenados por punto normativo ISO 14001 / 45001.
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <DocumentosManager initialDocumentos={documentos} isAdmin={!!session?.isAdmin} />
      </main>
    </div>
  );
}
