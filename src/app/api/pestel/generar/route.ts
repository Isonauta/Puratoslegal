import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// La generación completa (6 categorías) se corre en paralelo para que el
// tiempo total sea el de la llamada más lenta, no la suma de las 6 —
// aun así puede acercarse al límite por defecto de Vercel sin esto.
export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const CATEGORIAS = ["Político", "Económico", "Social", "Tecnológico", "Ambiental", "Legal"] as const;

function systemPrompt(categoria: string) {
  return `Eres un consultor experto en Sistemas de Gestión Integrados (ISO 14001:2015 y ISO 45001:2018) especializado en análisis de contexto organizacional (cláusula 4.1).

Tu tarea es generar SOLO la categoría "${categoria}" de un análisis PESTEL, realista, para la organización descrita, con el año 2026 como período de referencia — toda información, normativa o coyuntura que menciones debe corresponder a 2026, nunca a años anteriores.

Identifica 2 a 3 factores de la categoría "${categoria}". Para cada factor, evalúa su impacto tanto en el Sistema de Gestión de Seguridad y Salud en el Trabajo (SGSST, ISO 45001) como en el Sistema de Gestión Ambiental (SGA, ISO 14001) cuando aplique, generando entradas separadas por sistema y por clasificación (Oportunidad o Amenaza).

Responde EXCLUSIVAMENTE con un array JSON válido (sin markdown, sin texto adicional, sin backticks), donde cada elemento tiene esta forma exacta:
{
  "categoria": "${categoria}",
  "subFactor": "nombre corto del factor específico",
  "descripcion": "descripción de la situación/contexto actual (1 oración corta)",
  "sistema": "SST" | "MA",
  "clasificacion": "Oportunidad" | "Amenaza",
  "texto": "la oportunidad o amenaza concreta para ese sistema (1 oración corta)",
  "impactoTexto": "cómo impacta específicamente en ese sistema de gestión (1 oración corta)",
  "tipoImpacto": "ej. Financiero, Legal, Operacional, Reputacional",
  "relevancia": "Alta" | "Media" | "Baja"
}

Genera entre 3 y 5 elementos en total para esta categoría. Sé muy conciso — una oración corta por campo de texto, nunca párrafos. No agregues explicaciones fuera del JSON.`;
}

function contextoPrompt(c: { rubro: string; ubicaciones: string; tipoClientes: string; mercado: string; adicional: string }) {
  return `Organización: Puratos de Chile S.P.A.

RUBRO / ACTIVIDAD: ${c.rubro}
UBICACIONES: ${c.ubicaciones || "No especificado"}
TIPO DE CLIENTES: ${c.tipoClientes || "No especificado"}
MERCADO / SECTOR: ${c.mercado || "No especificado"}
CONTEXTO ADICIONAL: ${c.adicional || "No especificado"}

Genera los factores en el formato JSON indicado, con período de referencia 2026.`;
}

function parseRows(raw: string): Array<Record<string, unknown>> {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error("La respuesta no es un array");
  return parsed.filter((r) => r.categoria && r.descripcion && r.sistema && r.clasificacion && r.texto);
}

async function generarCategoria(categoria: string, userPrompt: string): Promise<Array<Record<string, unknown>>> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3500,
    system: systemPrompt(categoria),
    messages: [{ role: "user", content: userPrompt }],
  });
  const block = msg.content.find((b) => b.type === "text");
  const raw = block && block.type === "text" ? block.text : "";
  if (msg.stop_reason === "max_tokens") throw new Error("Respuesta truncada por max_tokens");
  return parseRows(raw);
}

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

  const userPrompt = contextoPrompt({ rubro, ubicaciones, tipoClientes, mercado, adicional });

  const results = await Promise.allSettled(
    CATEGORIAS.map((categoria) => generarCategoria(categoria, userPrompt))
  );

  const rows: Array<Record<string, unknown>> = [];
  const fallidas: string[] = [];
  results.forEach((res, i) => {
    if (res.status === "fulfilled") {
      rows.push(...res.value);
    } else {
      const detail = res.reason instanceof Anthropic.APIError
        ? `${res.reason.status ?? ""} ${res.reason.message}`.trim()
        : res.reason instanceof Error ? res.reason.message : String(res.reason);
      console.error(`[/api/pestel/generar] Falló categoría ${CATEGORIAS[i]}:`, detail);
      fallidas.push(`${CATEGORIAS[i]} (${detail})`);
    }
  });

  if (rows.length === 0) {
    return NextResponse.json(
      { error: `No se pudo generar ningún factor. Detalle: ${fallidas.join("; ")}` },
      { status: 502 }
    );
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

  return NextResponse.json(
    { count: result.count, warning: fallidas.length > 0 ? `No se pudieron generar: ${fallidas.join("; ")}` : null },
    { status: 201 }
  );
}
