import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const SYSTEM_PROMPT = `Eres un consultor experto en Sistemas de Gestión Integrados (ISO 9001:2015, cláusula 6.1 — acciones para abordar riesgos y oportunidades) especializado en planificación estratégica CAME (Corregir, Afrontar, Mantener, Explotar) a partir de una matriz FODA ya construida.

El análisis CAME cruza los cuadrantes de la matriz FODA para generar estrategias:
- FO (Fortalezas + Oportunidades): estrategias para EXPLOTAR — usar fortalezas para aprovechar oportunidades.
- FA (Fortalezas + Amenazas): estrategias para AFRONTAR — usar fortalezas para neutralizar amenazas.
- DO (Debilidades + Oportunidades): estrategias para CORREGIR — superar debilidades aprovechando oportunidades.
- DA (Debilidades + Amenazas): estrategias para MANTENER / defensivas — minimizar debilidades y evitar amenazas.

Responde EXCLUSIVAMENTE con un array JSON válido (sin markdown, sin backticks), con exactamente 4 elementos — uno por cada tipo (FO, FA, DO, DA) cuando haya al menos un ítem de cada cuadrante involucrado disponible; si falta contenido de un cuadrante, omite esa estrategia. Cada elemento:
{
  "sistema": "SST" | "MA",
  "tipo": "FO" | "FA" | "DO" | "DA",
  "titulo": "título breve y profesional de la estrategia",
  "descripcion": "la estrategia concreta, accionable, en 2-3 líneas — específica al contenido FODA entregado, no genérica",
  "itemsFoda": "referencia breve a qué fortalezas/debilidades/oportunidades/amenazas específicas cruza (cítalas por su descripción corta)",
  "prioridad": "Alta" | "Media" | "Baja"
}`;

interface FodaInput {
  cuadrante: string;
  sistema: string;
  descripcion: string;
}

function userPrompt(items: FodaInput[]) {
  const porCuadrante = (c: string) =>
    items.filter((i) => i.cuadrante === c).map((i) => `- [${i.sistema}] ${i.descripcion}`).join("\n") || "(ninguno)";

  return `Matriz FODA actual:

FORTALEZAS:
${porCuadrante("Fortaleza")}

DEBILIDADES:
${porCuadrante("Debilidad")}

OPORTUNIDADES:
${porCuadrante("Oportunidad")}

AMENAZAS:
${porCuadrante("Amenaza")}

Genera las estrategias CAME en el formato JSON indicado.`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY no está configurada en este proyecto de Vercel." }, { status: 500 });
  }

  const body = await req.json();
  const items = body.items as FodaInput[] | undefined;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No hay ítems FODA cargados todavía — completa la pestaña FODA antes de generar CAME." }, { status: 400 });
  }

  let raw: string;
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt(items) }],
    });
    const block = msg.content.find((b) => b.type === "text");
    raw = block && block.type === "text" ? block.text : "";
    if (msg.stop_reason === "max_tokens") {
      return NextResponse.json({ error: "La respuesta de la IA se cortó por ser muy larga. Intenta de nuevo." }, { status: 502 });
    }
  } catch (err) {
    const detail = err instanceof Anthropic.APIError
      ? `${err.status ?? ""} ${err.message}`.trim()
      : err instanceof Error ? err.message : String(err);
    console.error("[/api/came/generar] Error llamando a Anthropic:", detail);
    return NextResponse.json({ error: `Falló la llamada al modelo de IA: ${detail}` }, { status: 502 });
  }

  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "La IA no devolvió un JSON válido. Intenta de nuevo." }, { status: 502 });
  }

  if (!Array.isArray(parsed)) {
    return NextResponse.json({ error: "La respuesta generada no tiene el formato esperado" }, { status: 502 });
  }

  const rows = (parsed as Array<Record<string, unknown>>)
    .filter((r) => r.tipo && r.titulo && r.descripcion)
    .map((r) => ({
      sistema: r.sistema ? String(r.sistema) : "SST",
      tipo: String(r.tipo),
      titulo: String(r.titulo),
      descripcion: String(r.descripcion),
      itemsFoda: r.itemsFoda ? String(r.itemsFoda) : null,
      prioridad: r.prioridad ? String(r.prioridad) : "Media",
    }));

  return NextResponse.json({ rows }, { status: 200 });
}
