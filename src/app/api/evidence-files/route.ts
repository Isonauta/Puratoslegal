import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { StorageProvider } from "@/generated/prisma/enums";

const VALID_PROVIDERS: StorageProvider[] = ["SHAREPOINT", "GOOGLE_DRIVE"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { evidenceTemplateId, webUrl, provider, fileName } = body;

  if (!evidenceTemplateId || !webUrl || !VALID_PROVIDERS.includes(provider)) {
    return NextResponse.json({ error: "missing or invalid fields" }, { status: 400 });
  }

  const file = await prisma.evidenceFile.create({
    data: {
      evidenceTemplateId,
      webUrl,
      provider,
      fileName: fileName || null,
      externalId: webUrl,
      status: "VIGENTE",
    },
  });
  return NextResponse.json({ ok: true, file });
}
