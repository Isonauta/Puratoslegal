import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import PtsNavBar from "@/components/pts/NavBar";
import AtsForm from "@/components/pts/forms/AtsForm";
import type { UserRole } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function NewAtsPage({ searchParams }: { searchParams: Promise<{ permitId?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = (session.role ?? "ADMIN") as UserRole;
  const { permitId } = await searchParams;

  return (
    <>
      <PtsNavBar userName={session.name ?? undefined} userRole={role} />
      <AtsForm permitId={permitId} />
    </>
  );
}
