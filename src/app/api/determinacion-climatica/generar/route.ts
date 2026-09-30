import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const SYSTEM_PROMPT = `Eres un consultor experto en Sistemas de Gestión Integrados (ISO 9001:2015, ISO 14001:2015, ISO 45001:2018) especializado en la Resolución conjunta ISO/IAF de 2024 (Amendment 1:2024) que agrega a las cláusulas 4.1 y 4.2 la obligación de determinar formalmente si el cambio climático es una cuestión pertinente para el sistema de gestión.

Tu tarea es redactar esa determinación para la organización descrita, con 2026 como período de referencia — toda referencia normativa o de contexto debe corresponder a 2026, nunca a años anteriores.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin texto adicional, sin backticks) con esta forma exacta:
{
  "esPertinente": true,
  "justificacion": "justificación documentada de por qué el cambio climático es (o no es) pertinente para esta organización — 3 a 5 líneas, concreta y específica al rubro/ubicación descritos, apta para presentar a un auditor externo",
  "expectativasPartesInteresadas": "requisitos y expectativas de partes interesadas relacionados con cambio climático (clientes, autoridades, comunidad, accionistas) — 2 a 3 líneas",
  "riesgosFisicos": "riesgos físicos climáticos relevantes (eventos agudos o crónicos: sequía, calor extremo, inundaciones, escasez hídrica, etc.) — 2 a 3 líneas",
  "riesgosTransicion": "riesgos de transición (normativos, de mercado, tecnológicos, reputacionales derivados de la transición climática) — 2 a 3 líneas",
  "oportunidadesClimaticas": "oportunidades relacionadas con el cambio climático para esta organización — 2 a 3 líneas"
}

Casi siempre "esPertinente" debe ser true para organizaciones industriales/productivas — solo sería false en casos excepcionales (ej. oficina puramente administrativa sin operación física). Sé concreto y específico al contexto entregado, no genérico.`;

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
SISTEMAS DE GESTIÓN CERTIFICADOS: ISO 14001:2015 (Gestión Ambiental), ISO 45001:2018 (Seguridad y Salud en el Trabajo)

Redacta la determinación de pertinencia de cambio climático en el formato JSON indicado, con período de referencia 2026.`;

  let raw: string;
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
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
    console.error("[/api/determinacion-climatica/generar] Error llamando a Anthropic:", detail);
    return NextResponse.json({ error: `Falló la llamada al modelo de IA: ${detail}` }, { status: 502 });
  }

  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "La IA no devolvió un JSON válido. Intenta de nuevo." }, { status: 502 });
  }

  if (!parsed.justificacion) {
    return NextResponse.json({ error: "La respuesta generada no tiene el formato esperado" }, { status: 502 });
  }

  return NextResponse.json({
    esPertinente: !!parsed.esPertinente,
    justificacion: String(parsed.justificacion),
    expectativasPartesInteresadas: parsed.expectativasPartesInteresadas ? String(parsed.expectativasPartesInteresadas) : "",
    riesgosFisicos: parsed.riesgosFisicos ? String(parsed.riesgosFisicos) : "",
    riesgosTransicion: parsed.riesgosTransicion ? String(parsed.riesgosTransicion) : "",
    oportunidadesClimaticas: parsed.oportunidadesClimaticas ? String(parsed.oportunidadesClimaticas) : "",
  });
}
