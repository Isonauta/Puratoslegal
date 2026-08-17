import Link from "next/link";

export default function DashboardHero({ name }: { name: string }) {
  return (
    <div className="rounded-2xl bg-[#9B0E26] text-white px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-red-200 text-sm font-medium mb-1">Bienvenido/a, {name}</p>
        <h2 className="text-2xl font-bold leading-tight">Permiso de Trabajo Seguro</h2>
        <p className="text-red-200 text-sm mt-1">
          Gestiona, aprueba y supervisa permisos de trabajo en tiempo real.
        </p>
      </div>
      <Link
        href="/pts/permits/new"
        className="inline-flex items-center justify-center gap-2 bg-white text-[#C41230] font-semibold px-5 py-3 rounded-xl hover:bg-red-50 transition-colors whitespace-nowrap text-sm"
      >
        + Nuevo PTS
      </Link>
    </div>
  );
}
