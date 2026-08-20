import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SigDocumentosClient from "@/components/sig/SigDocumentosClient";

export const dynamic = "force-dynamic";

export default async function ManualSigPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/sig");

  const docs = await prisma.documento.findMany({
    include: { revisiones: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: [{ clausula: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Manual del SIG</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Procedimientos, matrices y registros del Sistema de Gestión — flujo de elaboración, revisión y aprobación.
        </p>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <SigDocumentosClient
          initialDocs={docs as Parameters<typeof SigDocumentosClient>[0]["initialDocs"]}
          userEmail={session.email}
          userName={session.name ?? session.email}
          isAdmin={!!session.isAdmin}
        />
      </main>
    </div>
  );
}
