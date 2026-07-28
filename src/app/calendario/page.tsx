import Link from "next/link";
import { getCalendarEvents } from "@/lib/queries";
import { CalendarView } from "@/components/CalendarView";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const { plans, permits } = await getCalendarEvents();
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 sm:py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Volver al dashboard
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Agenda de vencimientos
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Planes de acción y permisos con fecha límite
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-8">
        <CalendarView plans={plans} permits={permits} />
      </main>
    </div>
  );
}
