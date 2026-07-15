import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const SYSTEM_PROMPT = `Eres un asistente legal especializado exclusivamente en la legislación que aplica a Puratos Chile.

Tu base de conocimiento son los requisitos legales cargados en el sistema de cumplimiento de Puratos: normativa laboral, seguridad y salud en el trabajo (SST), medioambiente, calidad, y permisos sectoriales.

Reglas estrictas:
- SOLO responde preguntas relacionadas con los requisitos legales de Puratos Chile.
- Si te preguntan algo fuera de ese ámbito, declina amablemente y redirige al tema legal de Puratos.
- Cita siempre el número de artículo o requisito cuando sea relevante (N°X).
- Sé conciso y práctico — el usuario es el equipo de cumplimiento legal de Puratos.
- Si no tienes información suficiente para responder con certeza, dilo claramente.
- No inventes requisitos ni normas que no estén en el contexto provisto.

El contexto de requisitos relevantes se incluirá en cada mensaje del usuario.`;

type ReqRow = {
  numero: number;
  ambito: string;
  titulo: string;
  articulo: string | null;
  requisitoTexto: string | null;
  cumple: string;
};

async function fetchContext(question: string): Promise<string> {
  const words = question
    .toLowerCase()
    .replace(/[^a-záéíóúüñ\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);

  if (words.length === 0) return "";

  // Safe: build one query per word using tagged template (Prisma raw with $1 style params)
  const results = await Promise.all(
    words.map((w) => {
      const p = `%${w}%`;
      return prisma.$queryRaw<ReqRow[]>`
        SELECT numero, ambito, titulo, articulo, "requisitoTexto", cumple
        FROM "LegalRequirement"
        WHERE titulo ILIKE ${p}
           OR "requisitoTexto" ILIKE ${p}
           OR articulo ILIKE ${p}
        ORDER BY numero ASC
        LIMIT 6
      `;
    })
  );

  const seen = new Set<number>();
  const rows: ReqRow[] = [];
  for (const batch of results) {
    for (const r of batch) {
      if (!seen.has(r.numero)) {
        seen.add(r.numero);
        rows.push(r);
        if (rows.length >= 12) break;
      }
    }
    if (rows.length >= 12) break;
  }

  if (rows.length === 0) return "";

  const lines = rows.map((r) => {
    const estado =
      r.cumple === "SI" ? "Cumple" :
      r.cumple === "NO" ? "No cumple" :
      r.cumple === "NO_APLICA" ? "No aplica" : "Pendiente";
    const parts = [`N°${r.numero} [${r.ambito}] — ${r.titulo} (Estado actual: ${estado})`];
    if (r.articulo) parts.push(`  Artículo: ${r.articulo}`);
    if (r.requisitoTexto) parts.push(`  Texto: ${r.requisitoTexto.slice(0, 300)}`);
    return parts.join("\n");
  });

  return `\n\n--- REQUISITOS LEGALES DE PURATOS RELACIONADOS ---\n${lines.join("\n\n")}\n--- FIN CONTEXTO ---`;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY no configurada. Agrégala en las variables de entorno de Vercel." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const lastUserMsg = messages.findLast((m) => m.role === "user")?.content ?? "";
  const context = await fetchContext(lastUserMsg);

  const augmented = messages.map((m, i) =>
    i === messages.length - 1 && m.role === "user"
      ? { ...m, content: m.content + context }
      : m
  );

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: augmented,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
