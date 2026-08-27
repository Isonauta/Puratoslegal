import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PtsNavBar from "@/components/pts/NavBar";
import AtsForm from "@/components/pts/forms/AtsForm";
import type { UserRole } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function toDateStr(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

function toTimeStr(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(11, 16);
}

export default async function NewAtsPage({ searchParams }: { searchParams: Promise<{ permitId?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login?from=/pts/ats/new");

  const role = (session.role ?? "ADMIN") as UserRole;
  const { permitId } = await searchParams;

  let permitData: Parameters<typeof AtsForm>[0]["permitData"] = undefined;

  if (permitId) {
    const permit = await prisma.workPermit.findUnique({
      where: { id: permitId },
      include: { company: true, workers: true },
    });
    if (permit) {
      permitData = {
        companyName: permit.company?.name ?? "",
        area: permit.area ?? "",
        date: toDateStr(permit.date),
        startTime: toTimeStr(permit.startTime),
        endTime: toTimeStr(permit.endTime),
        taskDescription: permit.taskDescription ?? "",
        permitTypes: permit.permitTypes,
        controlMeasures: permit.controlMeasures,
        ppeRequired: permit.ppeRequired,
        workers: permit.workers.map((w) => ({ fullName: w.fullName, rut: w.rut })),
      };
    }
  }

  return (
    <>
      <PtsNavBar userName={session.name ?? undefined} userRole={role} />
      <AtsForm permitId={permitId} permitData={permitData} />
    </>
  );
}
