import { getAllRequirements } from "@/lib/queries";
import { RequirementRow } from "@/components/RequirementRow";

export const dynamic = "force-dynamic";

export default async function RequisitosPage() {
  const requirements = await getAllRequirements();

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Gestión de Requisitos y Evidencia</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Actualiza el estado de cumplimiento y vincula la evidencia (SharePoint / Google Drive) de cada requisito.
        </p>
      </header>

      <main className="mx-auto max-w-6xl space-y-3 px-6 py-8">
        {requirements.map((r) => (
          <RequirementRow key={r.id} requirement={r} />
        ))}
      </main>
    </div>
  );
}
