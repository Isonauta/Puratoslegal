import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NoticiasClient from "./NoticiasClient";

export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const raw = await prisma.noticia.findMany({
    where: { publicado: true },
    orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
  });

  const noticias = raw.map(n => ({ ...n, createdAt: n.createdAt.toISOString() }));

  return <NoticiasClient noticias={noticias} isAdmin={isAdmin} />;
}
