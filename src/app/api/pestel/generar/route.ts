import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// La generación puede tomar más de los 10s por defecto de Vercel —
// sin esto, la función se corta a medio camino y aparece como 502.
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const SYSTEM_PROMPT = `Eres un consultor experto en Sistemas de Gestión Integrados (ISO 14001:2015 y ISO 45001:2018) especializado en análisis de contexto organizacional (cláusula 4.1).

Tu tarea es generar un análisis PESTEL (Político, Económico, Social, Tecnológico, Ambiental, Legal) completo y realista para la organización descrita, considerando el año 2026 como período de referencia — toda la información, normativa y coyuntura que menciones debe corresponder a 2026, nunca a años anteriores.

Para cada una de las 6 categorías PESTEL, identifica 2 a 4 factores relevantes. Para cada factor, evalúa su impacto tanto en el Sistema de Gestión de Seguridad y Salud en el Trabajo (SGSST, ISO 45001) como en el Sistema de Gestión Ambiental (SGA, ISO 14001) cuando aplique, generando entradas separadas por sistema y por clasificación (Oportunidad o Amenaza).

Responde EXCLUSIVAMENTE con un array JSON válido (sin markdown, sin texto adicional, sin backticks), donde cada elemento tiene esta forma exacta:
{
  "categoria": "Político" | "Económico" | "Social" | "Tecnológico" | "Ambiental" | "Legal",
  "subFactor": "nombre corto del factor específico",
  "descripcion": "descripción de la situación/contexto actual (2-3 líneas)",
  "sistema": "SST" | "MA",
  "clasificacion": "Oportunidad" | "Amenaza",
  "texto": "la oportunidad o amenaza concreta para ese sistema (1-2 líneas)",
  "impactoTexto": "cómo impacta específicamente en ese sistema de gestión (1 línea)",
  "tipoImpacto": "ej. Financiero, Legal, Operacional, Reputacional (separados por coma si aplica más de uno)",
  "relevancia": "Alta" | "Media" | "Baja"
}

Genera entre 24 y 32 elementos en total (varias entradas por factor, cubriendo SST y MA, oportunidad y amenaza cuando sea razonable). No repitas literalmente el mismo texto en dos entradas. Sé conciso en cada campo de texto — 1-2 líneas, no párrafos largos.`;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY no está configurada en este proyecto de Vercel." }, { status: 500 });
  }

  const body = await req.json();
  const { rubro, ubicaciones, tipoClientes, mercado, adicional } = body;

  if (!rubro) {
    return NextResponse.json({ error: "Falta describir el rubro/actividad de la empresa en Contexto" }, { status: 400 });
  }

  const userPrompt = `Organización: Puratos de Chile S.P.A.

RUBRO / ACTIVIDAD: ${rubro}
UBICACIONES: ${ubicaciones || "No especificado"}
TIPO DE CLIENTES: ${tipoClientes || "No especificado"}
MERCADO / SECTOR: ${mercado || "No especificado"}
CONTEXTO ADICIONAL: ${adicional || "No especificado"}

Genera el análisis PESTEL completo en el formato JSON indicado, con período de referencia 2026.`;

  let raw: string;
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = msg.content.find((b) => b.type === "text");
    raw = block && block.type === "text" ? block.text : "";
    if (msg.stop_reason === "max_tokens") {
      console.error("[/api/pestel/generar] Respuesta truncada por max_tokens");
      return NextResponse.json({ error: "La respuesta de la IA se cortó por ser muy larga. Intenta de nuevo." }, { status: 502 });
    }
  } catch (err) {
    console.error("[/api/pestel/generar] Error llamando a Anthropic:", err);
    const detail = err instanceof Anthropic.APIError
      ? `${err.status ?? ""} ${err.message}`.trim()
      : err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Falló la llamada al modelo de IA: ${detail}` }, { status: 502 });
  }

  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "La IA no devolvió un JSON válido. Intenta de nuevo." }, { status: 502 });
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return NextResponse.json({ error: "La IA no generó factores PESTEL" }, { status: 502 });
  }

  const rows = (parsed as Array<Record<string, unknown>>).filter(
    (r) => r.categoria && r.descripcion && r.sistema && r.clasificacion && r.texto
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Los factores generados no tienen el formato esperado" }, { status: 502 });
  }

  const result = await prisma.pestelFactor.createMany({
    data: rows.map((r) => ({
      categoria: String(r.categoria),
      subFactor: r.subFactor ? String(r.subFactor) : null,
      descripcion: String(r.descripcion),
      sistema: String(r.sistema),
      clasificacion: String(r.clasificacion),
      texto: String(r.texto),
      impactoTexto: r.impactoTexto ? String(r.impactoTexto) : null,
      tipoImpacto: r.tipoImpacto ? String(r.tipoImpacto) : null,
      relevancia: r.relevancia ? String(r.relevancia) : null,
      createdBy: session.email ?? null,
    })),
  });

  return NextResponse.json({ count: result.count }, { status: 201 });
}
