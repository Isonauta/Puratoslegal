import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppSidebar from "@/components/AppSidebar";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?from=/");

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <AppSidebar userName={session.name ?? session.email} isAdmin={session.isAdmin} />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
