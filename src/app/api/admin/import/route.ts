import { NextRequest, NextResponse } from "next/server";
import { runImport } from "../../../../../prisma/seed/importCore";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-import-secret");
  if (!process.env.IMPORT_SECRET || secret !== process.env.IMPORT_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const matriz = form.get("matriz");
  const evidencias = form.get("evidencias");
  const permisos = form.get("permisos");

  if (!(matriz instanceof File) || !(evidencias instanceof File) || !(permisos instanceof File)) {
    return NextResponse.json({ error: "missing files" }, { status: 400 });
  }

  try {
    const result = await runImport({
      matriz: Buffer.from(await matriz.arrayBuffer()),
      evidencias: Buffer.from(await evidencias.arrayBuffer()),
      permisos: Buffer.from(await permisos.arrayBuffer()),
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
