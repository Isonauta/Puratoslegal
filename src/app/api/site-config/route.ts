import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { key, value } = await req.json();
  if (!key || value === undefined) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });

  const config = await prisma.siteConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return NextResponse.json(config);
}
