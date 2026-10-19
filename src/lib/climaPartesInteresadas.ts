import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { getWeatherNow, type WeatherNow } from "@/lib/weather";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

export interface AnalisisParteInteresada {
  parteInteresadaId: string;
  nombre: string;
  analisis: string;
}

export interface ClimaPartesResultado {
  weather: WeatherNow | null;
  condicionesActivas: string[];
  analisis: AnalisisParteInteresada[];
  error?: string;
}

const SYSTEM_PROMPT = `Eres un analista SST/ambiental que cruza condiciones climáticas actuales con la matriz real de partes interesadas de una organización (ISO 9001/14001/45001, cláusula 4.2).

Recibes el clima de hoy (ya evaluado contra umbrales normativos) y la lista real de partes interesadas con sus necesidades/expectativas registradas. Tu tarea es identificar ÚNICAMENTE las partes interesadas cuya necesidad o expectativa tenga una conexión real y concreta con la condición climática de hoy — no fuerces relaciones débiles ni incluyas a todas por completar la lista.

Para cada parte interesada genuinamente afectada, escribe un análisis breve (1-2 líneas) de qué actividad o tarea conviene revisar hoy a raíz de esa condición específica.

Responde EXCLUSIVAMENTE con un array JSON válido (sin markdown, sin backticks). Si ninguna parte interesada tiene una conexión real, responde con un array vacío []. Cada elemento:
{
  "parteInteresadaId": "el id exacto recibido, sin modificar",
  "analisis": "qué revisar hoy, concreto y específico (1-2 líneas)"
}`;

function condicionesDe(w: WeatherNow): string[] {
  const out: string[] = [];
  if (w.alertas.tempAlta) out.push(`Temperatura alta (máx. hoy ${Math.round(w.tempMaxHoyC)}°C)`);
  if (w.alertas.tempFria) out.push(`Frío (${Math.round(w.tempC)}°C actual, ≤10°C)`);
  if (w.alertas.uvAlto || w.alertas.uvPorHorarioEstacional) out.push(`Radiación UV alta (índice ${Math.round(w.uvIndex)})`);
  if (w.alertas.lluvia) out.push(`Probabilidad alta de lluvia (${Math.round(w.precipProbPct)}%)`);
  if (w.alertas.vientoFuerte) out.push(`Viento fuerte (${Math.round(w.windKmh)} km/h)`);
  if (w.alertas.condicionSevera) out.push(`Condición severa: ${w.condicion}`);
  return out;
}

// Cache en memoria — se recalcula a lo sumo cada 1h, igual ventana que el
// clima (getWeatherNow ya cachea Open-Meteo con next.revalidate=3600). Best
// effort: en Vercel una instancia fría puede recalcular antes, no es un
// problema — solo evita llamadas repetidas a Claude en la misma instancia.
let cache: { result: ClimaPartesResultado; expiresAt: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

export async function getAnalisisClimaPartesInteresadas(): Promise<ClimaPartesResultado> {
  if (cache && cache.expiresAt > Date.now()) return cache.result;

  const weather = await getWeatherNow();
  if (!weather) {
    const result = { weather: null, condicionesActivas: [], analisis: [] };
    cache = { result, expiresAt: Date.now() + TTL_MS };
    return result;
  }

  const condicionesActivas = condicionesDe(weather);
  if (condicionesActivas.length === 0) {
    const result = { weather, condicionesActivas: [], analisis: [] };
    cache = { result, expiresAt: Date.now() + TTL_MS };
    return result;
  }

  const partes = await prisma.parteInteresada.findMany();
  if (partes.length === 0) {
    const result = { weather, condicionesActivas, analisis: [] };
    cache = { result, expiresAt: Date.now() + TTL_MS };
    return result;
  }

  const userPrompt = `CONDICIONES CLIMÁTICAS DE HOY:\n${condicionesActivas.map((c) => `- ${c}`).join("\n")}\n\nPARTES INTERESADAS REGISTRADAS:\n${partes
    .map((p) => `- id "${p.id}": ${p.nombre} (poder ${p.poder}, impacto ${p.impacto})${p.necesidades ? ` — Necesidades: ${p.necesidades}` : ""}${p.expectativas ? ` — Expectativas: ${p.expectativas}` : ""}`)
    .join("\n")}\n\nGenera el array JSON indicado.`;

  if (!process.env.ANTHROPIC_API_KEY) {
    const result = { weather, condicionesActivas, analisis: [], error: "ANTHROPIC_API_KEY no configurada." };
    return result; // no cachear el error — reintentar en la próxima carga
  }

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = msg.content.find((b) => b.type === "text");
    const raw = block && block.type === "text" ? block.text : "[]";
    const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{ parteInteresadaId: string; analisis: string }>;

    const byId = new Map(partes.map((p) => [p.id, p]));
    const analisis: AnalisisParteInteresada[] = parsed
      .filter((r) => r.parteInteresadaId && byId.has(r.parteInteresadaId) && r.analisis)
      .map((r) => ({ parteInteresadaId: r.parteInteresadaId, nombre: byId.get(r.parteInteresadaId)!.nombre, analisis: String(r.analisis) }));

    const result = { weather, condicionesActivas, analisis };
    cache = { result, expiresAt: Date.now() + TTL_MS };
    return result;
  } catch (e) {
    console.error("[getAnalisisClimaPartesInteresadas]", e instanceof Error ? e.message : e);
    return { weather, condicionesActivas, analisis: [], error: "No se pudo generar el análisis en este momento." };
  }
}
