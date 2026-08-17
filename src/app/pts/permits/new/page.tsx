import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/client";
import PtsNavBar from "@/components/pts/NavBar";
import PermitWizard from "@/components/pts/forms/PermitWizard";

export const dynamic = "force-dynamic";

export default async function NewPermitPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = (session.role ?? "ADMIN") as UserRole;
  const allowed: UserRole[] = ["SOLICITANTE", "CONTRATISTA", "ADMIN"];
  if (!allowed.includes(role)) redirect("/pts");

  return (
    <>
      <PtsNavBar userName={session.name ?? undefined} userRole={role} />
      <PermitWizard />
    </>
  );
}
