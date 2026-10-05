import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isNearMissReviewer } from "@/lib/nearMiss";
import NearMissTriageClient from "./NearMissTriageClient";

export const dynamic = "force-dynamic";

export default async function NearMissTriagePage() {
  const session = await getSession();
  if (!isNearMissReviewer(session?.email)) redirect("/");

  const raw = await prisma.nearMiss.findMany({
    orderBy: [{ estado: "asc" }, { fecha: "desc" }],
  });

  const items = raw.map((n) => ({
    ...n,
    fecha: n.fecha.toISOString(),
    triageFecha: n.triageFecha?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));

  return <NearMissTriageClient items={items} />;
}
