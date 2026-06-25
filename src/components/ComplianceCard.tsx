import type { ComplianceByAmbito } from "@/lib/queries";

const AMBITO_LABEL: Record<string, string> = {
  SST: "Seguridad y Salud en el Trabajo",
  MA: "Medio Ambiente",
  SGI: "Sistema de Gestión Integrado",
  GENERAL: "General",
};

function barColor(pct: number) {
  if (pct >= 95) return "bg-emerald-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-red-500";
}

export function ComplianceCard({ data }: { data: ComplianceByAmbito }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {AMBITO_LABEL[data.ambito] ?? data.ambito}
        </h3>
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{data.porcentaje}%</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full ${barColor(data.porcentaje)}`} style={{ width: `${data.porcentaje}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Cumple</dt>
          <dd className="font-medium text-emerald-600 dark:text-emerald-400">{data.cumple}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">No cumple</dt>
          <dd className="font-medium text-red-600 dark:text-red-400">{data.noCumple}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Pendiente</dt>
          <dd className="font-medium text-amber-600 dark:text-amber-400">{data.pendiente}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">No aplica</dt>
          <dd className="font-medium text-zinc-500 dark:text-zinc-400">{data.noAplica}</dd>
        </div>
      </dl>
    </div>
  );
}
