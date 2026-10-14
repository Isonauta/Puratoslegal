import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const SYSTEM_PROMPT = `Eres un consultor experto en Sistemas de Gestión Integrados (ISO 9001:2015, ISO 14001:2015, ISO 45001:2018 — cláusula 6.1, acciones para abordar riesgos y oportunidades).

Recibes una lista de ítems FODA (Fortalezas, Debilidades, Oportunidades, Amenazas) ya cargados por la organización, cada uno con un id temporal. Tu tarea es convertir CADA UNO en una entrada de la Matriz de Riesgos y Oportunidades: Debilidades y Amenazas se convierten en Riesgos; Fortalezas y Oportunidades se convierten en Oportunidades.

Para cada ítem, evalúa probabilidad (1-5) e impacto (1-5) con criterio real y conservador, no siempre el mismo valor:
Probabilidad — 1 Rara, 2 Improbable, 3 Posible, 4 Probable, 5 Casi segura.
Impacto — 1 Insignificante, 2 Menor, 3 Moderado, 4 Mayor, 5 Catastrófico.

Responde EXCLUSIVAMENTE con un array JSON válido (sin markdown, sin backticks), con un elemento por cada ítem recibido, en el mismo orden, con esta forma exacta:
{
  "fodaId": "el id del ítem FODA recibido, exactamente igual, sin modificar",
  "tipo": "Riesgo" | "Oportunidad",
  "proceso": "proceso o área afectada (corto)",
  "descripcion": "descripción formal del riesgo/oportunidad para la matriz (1-2 líneas)",
  "causas": "causas raíz probables (1 línea)",
  "consecuencias": "consecuencias si no se trata (1 línea)",
  "probabilidad": 1 a 5,
  "impacto": 1 a 5,
  "tratamiento": para Riesgo una de "Mitigar"|"Aceptar"|"Transferir"|"Eliminar"; para Oportunidad una de "Aprovechar"|"Aceptar"|"Mitigar",
  "accionControl": "acción de control o aprovechamiento propuesta (1-2 líneas)"
}`;

interface FodaInput {
  fodaId: string;
  cuadrante: string;
  sistema: string;
  cuestion: string;
  descripcion: string;
}

function userPrompt(items: FodaInput[]) {
  const lista = items
    .map((i) => `- id "${i.fodaId}" [${i.sistema}] ${i.cuadrante} / ${i.cuestion}: ${i.descripcion}`)
    .join("\n");
  return `Ítems FODA a convertir:\n\n${lista}\n\nGenera el array JSON indicado, un elemento por ítem, en el mismo orden.`;
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
    return NextResponse.json({ error: "No hay ítems FODA pendientes de promover." }, { status: 400 });
  }
  if (items.length > 10) {
    return NextResponse.json({ error: "Son demasiados ítems para una sola pasada (máx. 10). Promueve en tandas más chicas." }, { status: 400 });
  }

  let raw: string;
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt(items) }],
    });
    const block = msg.content.find((b) => b.type === "text");
    raw = block && block.type === "text" ? block.text : "";
    if (msg.stop_reason === "max_tokens") {
      return NextResponse.json({ error: "La respuesta de la IA se cortó por ser muy larga. Prueba con menos ítems a la vez." }, { status: 502 });
    }
  } catch (err) {
    const detail = err instanceof Anthropic.APIError
      ? `${err.status ?? ""} ${err.message}`.trim()
      : err instanceof Error ? err.message : String(err);
    console.error("[/api/estrategia-riesgos/generar] Error llamando a Anthropic:", detail);
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

  const byTempId = new Map(items.map((i) => [i.fodaId, i]));

  const rows = (parsed as Array<Record<string, unknown>>)
    .filter((r) => r.fodaId && byTempId.has(String(r.fodaId)) && r.descripcion && r.probabilidad && r.impacto)
    .map((r) => {
      const origen = byTempId.get(String(r.fodaId))!;
      return {
        origenFodaId: origen.fodaId,
        tipo: r.tipo ? String(r.tipo) : (origen.cuadrante === "Amenaza" || origen.cuadrante === "Debilidad" ? "Riesgo" : "Oportunidad"),
        programa: origen.sistema,
        proceso: r.proceso ? String(r.proceso) : origen.cuestion,
        descripcion: String(r.descripcion),
        causas: r.causas ? String(r.causas) : null,
        consecuencias: r.consecuencias ? String(r.consecuencias) : null,
        probabilidad: Math.min(5, Math.max(1, parseInt(String(r.probabilidad)) || 3)),
        impacto: Math.min(5, Math.max(1, parseInt(String(r.impacto)) || 3)),
        tratamiento: r.tratamiento ? String(r.tratamiento) : "Mitigar",
        accionControl: r.accionControl ? String(r.accionControl) : null,
      };
    });

  return NextResponse.json({ rows }, { status: 200 });
}
