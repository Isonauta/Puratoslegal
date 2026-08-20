import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BUCKET = "documentos";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: "Storage no configurado" }, { status: 500 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Falta archivo" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `politicas/${Date.now()}.${ext}`;

  const upload = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": file.type || "application/pdf",
    },
    body: await file.arrayBuffer(),
  });

  if (!upload.ok) {
    const err = await upload.text();
    return NextResponse.json({ error: `Error en storage: ${err}` }, { status: 500 });
  }

  const publicUrl = `${url}/storage/v1/object/public/${BUCKET}/${path}`;
  return NextResponse.json({ url: publicUrl });
}
