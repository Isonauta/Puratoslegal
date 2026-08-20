import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NoticiasHub from "./NoticiasHub";

export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  const session = await getSession();
  const isAdmin = session?.isAdmin ?? false;

  const [rawNoticias, rawVideos, rawPoliticas, rawTerminos] = await Promise.all([
    prisma.noticia.findMany({ where: { publicado: true }, orderBy: [{ destacado: "desc" }, { createdAt: "desc" }] }),
    prisma.video.findMany({ where: { publicado: true }, orderBy: { orden: "asc" } }),
    prisma.politica.findMany({ where: { publicado: true }, orderBy: { orden: "asc" } }),
    prisma.termino.findMany({ orderBy: { orden: "asc" } }),
  ]);

  const noticias = rawNoticias.map(n => ({ ...n, createdAt: n.createdAt.toISOString() }));
  const videos = rawVideos.map(v => ({ ...v, createdAt: v.createdAt.toISOString(), updatedAt: v.updatedAt.toISOString() }));
  const politicas = rawPoliticas.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() }));
  const terminos = rawTerminos.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() }));

  return <NoticiasHub noticias={noticias} videos={videos} politicas={politicas} terminos={terminos} isAdmin={isAdmin} />;
}
