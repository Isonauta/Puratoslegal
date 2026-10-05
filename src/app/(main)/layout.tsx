import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppSidebar from "@/components/AppSidebar";
import { getNoConformidadesSummary, getObjetivosIndicadoresSummary, getNearMissSummary } from "@/lib/queries";
import { isNearMissReviewer } from "@/lib/nearMiss";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?from=/");

  const reviewer = isNearMissReviewer(session.email);

  const [ncSummary, objSummary, nearMissSummary] = await Promise.all([
    getNoConformidadesSummary(),
    getObjetivosIndicadoresSummary(),
    reviewer ? getNearMissSummary() : Promise.resolve(null),
  ]);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <AppSidebar
        userName={session.name ?? session.email}
        isAdmin={session.isAdmin}
        isNearMissReviewer={reviewer}
        badges={{
          noConformidadesAbiertas: ncSummary.abiertasTotal,
          objetivosPct: objSummary.pctCumplimiento,
          nearMissAbiertos: nearMissSummary?.abiertosTotal,
        }}
      />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
