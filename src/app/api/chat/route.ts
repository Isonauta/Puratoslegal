import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

// Mapa de acrónimos y términos comunes → palabras clave de búsqueda en DB
const SYNONYMS: Record<string, string[]> = {
  riohs:       ["reglamento interno orden higiene", "reglamento interno"],
  "ds40":      ["decreto 40", "ds 40", "reglamento polvo"],
  "ds594":     ["decreto 594", "condiciones sanitarias", "ambientales lugares trabajo"],
  "ds76":      ["decreto 76", "empresa principal", "contratista"],
  "ds44":      ["decreto 44", "trabajos pesados"],
  "ley16744":  ["ley 16744", "accidentes trabajo", "enfermedades profesionales"],
  "ley20123":  ["ley 20123", "subcontratación", "suministro"],
  sst:         ["seguridad salud trabajo", "salud ocupacional"],
  epp:         ["equipo protección personal", "elementos protección"],
  faena:       ["lugar trabajo", "faena"],
  copaso:      ["comité paritario", "comité higiene"],
  cphs:        ["comité paritario", "higiene seguridad"],
  mutual:      ["organismo administrador", "mutualidad"],
  suseso:      ["superintendencia seguridad social"],
  sernageomin: ["sernageomin", "seguridad minera"],
  seremi:      ["seremi salud", "autoridad sanitaria"],
  "codigo trabajo": ["código trabajo", "relaciones laborales"],
  medioambiente: ["medio ambiente", "ambiental", "residuos"],
  rsd:         ["residuos sólidos domiciliarios", "residuos"],
  pgrsd:       ["plan gestión residuos", "residuos sólidos"],
};

const SYSTEM_PROMPT = `Eres un asistente legal especializado en la legislación que aplica a Puratos Chile.

Contexto: Puratos Chile es una empresa manufacturera del sector alimentario (ingredientes para panificación, pastelería y chocolate). Opera bajo la legislación chilena laboral, de seguridad y salud en el trabajo (SST), medioambiente y calidad.

Instrucciones de formato (OBLIGATORIO):
- Usa texto limpio y bien estructurado.
- Para destacar algo importante usa **negrita** con doble asterisco.
- Para listas usa guion (-) al inicio de cada ítem.
- Separa secciones con una línea en blanco.
- NO uses #, ##, ni otros símbolos de markdown.
- Sé conciso y directo — el usuario es el equipo de cumplimiento legal.

Instrucciones de contenido:
- Cuando tengas contexto de la DB de Puratos, úsalo y cita el número de requisito (N°X).
- Cuando no tengas contexto específico, responde con conocimiento general de la legislación chilena aplicable, indicando claramente que es conocimiento general y no un dato cargado en el sistema.
- SOLO responde sobre temas legales o normativos aplicables a Puratos Chile.
- Si preguntan algo completamente fuera del ámbito legal, declina brevemente.`;

type ReqRow = {
  numero: number;
  ambito: string;
  titulo: string;
  articulo: string | null;
  requisitoTexto: string | null;
  cumple: string;
};

function expandQuery(question: string): string[] {
  const q = question.toLowerCase().replace(/[^a-záéíóúüñ0-9\s]/gi, " ");
  const words = q.split(/\s+/).filter((w) => w.length > 3);

  const extra: string[] = [];
  for (const [key, expansions] of Object.entries(SYNONYMS)) {
    if (q.includes(key)) {
      extra.push(...expansions.flatMap((e) => e.split(" ").filter((w) => w.length > 3)));
    }
  }

  return [...new Set([...words, ...extra])].slice(0, 10);
}

async function fetchContext(question: string): Promise<{ context: string; found: boolean }> {
  const terms = expandQuery(question);
  if (terms.length === 0) return { context: "", found: false };

  const results = await Promise.all(
    terms.map((w) => {
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
        if (rows.length >= 15) break;
      }
    }
    if (rows.length >= 15) break;
  }

  if (rows.length === 0) return { context: "", found: false };

  const lines = rows.map((r) => {
    const estado =
      r.cumple === "SI" ? "Cumple" :
      r.cumple === "NO" ? "No cumple" :
      r.cumple === "NO_APLICA" ? "No aplica" : "Pendiente";
    const parts = [`N°${r.numero} [${r.ambito}] — ${r.titulo} (Estado: ${estado})`];
    if (r.articulo) parts.push(`  Artículo: ${r.articulo}`);
    if (r.requisitoTexto) parts.push(`  Texto: ${r.requisitoTexto.slice(0, 350)}`);
    return parts.join("\n");
  });

  return {
    context: `\n\n--- REQUISITOS DE PURATOS RELACIONADOS ---\n${lines.join("\n\n")}\n--- FIN CONTEXTO ---`,
    found: true,
  };
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY no configurada." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const lastUserMsg = messages.findLast((m) => m.role === "user")?.content ?? "";
  const { context, found } = await fetchContext(lastUserMsg);

  // Si no encontró nada en DB, avisa a Claude para que use conocimiento general
  const fallbackNote = !found
    ? "\n\n[NOTA: No se encontraron requisitos específicos en la base de datos de Puratos para esta consulta. Responde con conocimiento general de la legislación chilena aplicable, indicando que es conocimiento general y no un requisito cargado en el sistema.]"
    : "";

  const augmented = messages.map((m, i) =>
    i === messages.length - 1 && m.role === "user"
      ? { ...m, content: m.content + context + fallbackNote }
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
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
