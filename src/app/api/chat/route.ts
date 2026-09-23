import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const SYSTEM_PROMPT = `Eres Purasafe, el asistente IA del Sistema de Gestión Integrado (SIG) de Puratos Chile — empresa del sector alimentario (ingredientes para panificación, pastelería y chocolate) con operaciones en Santiago.

Ayudas al equipo de Puratos con todo lo relacionado al SIG: seguridad y salud en el trabajo (SST), medio ambiente (MA), calidad, no conformidades, auditorías internas, capacitación, objetivos e indicadores, requisitos legales, permisos de trabajo, planes de acción y accidentabilidad DS67.

PERSONALIDAD:
- Cálido, directo y profesional — como un colega experto del área SIG
- Usas un lenguaje natural, sin tecnicismos innecesarios
- Cuando tienes datos reales del sistema de Puratos, los citas con precisión
- Cuando no tienes datos específicos, orientas con conocimiento general de ISO 45001 / ISO 14001 / ISO 9001 y la legislación chilena aplicable, indicando claramente que es conocimiento general

CUANDO ENCUENTRAS DATOS EN EL SISTEMA:
- Los usas como base de tu respuesta de forma natural
- Citas el número de registro cuando es relevante (ej. "la No Conformidad NC-007", "el Objetivo OI-003")
- Conectas los datos con una recomendación práctica

CUANDO NO TIENES DATOS ESPECÍFICOS:
- No dices simplemente "no encontré nada" — orientas con lo que sí sabes
- Sugieres a qué módulo del sistema ir para registrar o revisar el tema
- Mantienes un tono útil y proactivo

FORMATO DE RESPUESTA:
- Texto limpio y bien estructurado
- Usa **negrita** para términos o datos clave
- Usa guion (-) para listas
- Separa secciones con línea en blanco
- NO uses # ni ## para títulos
- Respuestas concisas — el usuario está operando, no estudiando

Puedes responder sobre cualquier tema relacionado al SIG, seguridad, medio ambiente, calidad y operaciones de Puratos Chile. Si algo está completamente fuera de ese ámbito, declinas brevemente y redireccionas.`;

// ── Búsqueda RAG multi-tabla ──────────────────────────────────────────────

type ReqRow = { numero: number; ambito: string; titulo: string; requisitoTexto: string | null; cumple: string };
type NCRow  = { numero: number; titulo: string; area: string; estado: string; impacto: string; fechaDeteccion: Date };
type OIRow  = { numero: number; objetivo: string; indicador: string; programa: string; estado: string; valorActual: number; meta: number; unidad: string };
type AudRow = { numero: number; titulo: string; programa: string; estado: string; noConformidades: number };
type CapRow = { numero: number; titulo: string; estado: string; fechaPlan: Date; participantes: number };

async function fetchContext(question: string): Promise<string> {
  const q = question.toLowerCase();
  const p = `%${question.slice(0, 80)}%`;
  const parts: string[] = [];

  // ── Requisitos legales ────────────────────────────────────────────────────
  if (/ley|decreto|ds\s?\d|norma|legal|requisito|cumpl|reglamento/i.test(q)) {
    const words = question.split(/\s+/).filter(w => w.length > 4).slice(0, 5);
    const rows = await Promise.all(words.map(w =>
      prisma.$queryRaw<ReqRow[]>`
        SELECT numero, ambito, titulo, "requisitoTexto", cumple FROM "LegalRequirement"
        WHERE titulo ILIKE ${`%${w}%`} OR "requisitoTexto" ILIKE ${`%${w}%`}
        LIMIT 4`
    ));
    const seen = new Set<number>();
    const reqs: ReqRow[] = [];
    for (const batch of rows) for (const r of batch) { if (!seen.has(r.numero)) { seen.add(r.numero); reqs.push(r); } }
    if (reqs.length > 0) {
      parts.push("**REQUISITOS LEGALES PURATOS:**\n" + reqs.slice(0, 8).map(r => {
        const estado = r.cumple === "SI" ? "Cumple" : r.cumple === "NO" ? "No cumple" : "Pendiente";
        return `- N°${r.numero} [${r.ambito}] ${r.titulo} (${estado})${r.requisitoTexto ? ": " + r.requisitoTexto.slice(0, 200) : ""}`;
      }).join("\n"));
    }
  }

  // ── No Conformidades ──────────────────────────────────────────────────────
  if (/no conform|nc|hallazgo|correc|preventiv|evidenc/i.test(q)) {
    const ncs = await prisma.$queryRaw<NCRow[]>`
      SELECT numero, titulo, area, estado, impacto, "fechaDeteccion" FROM "NoConformidad"
      WHERE titulo ILIKE ${p} OR area ILIKE ${p} OR estado ILIKE ${p}
         OR descripcion ILIKE ${p}
      ORDER BY "fechaDeteccion" DESC LIMIT 6`;
    // Si busca abiertas/pendientes, traer las más recientes
    const abiertas = await prisma.$queryRaw<NCRow[]>`
      SELECT numero, titulo, area, estado, impacto, "fechaDeteccion" FROM "NoConformidad"
      WHERE estado != 'Cerrada'
      ORDER BY impacto DESC, "fechaDeteccion" DESC LIMIT 5`;
    const all = [...ncs, ...abiertas].filter((r, i, arr) => arr.findIndex(x => x.numero === r.numero) === i).slice(0, 8);
    if (all.length > 0) {
      parts.push("**NO CONFORMIDADES EN SISTEMA:**\n" + all.map(r =>
        `- NC-${String(r.numero).padStart(3,"0")} [${r.impacto}] ${r.titulo} (${r.area}) — ${r.estado}`
      ).join("\n"));
    }
  }

  // ── Objetivos e Indicadores ───────────────────────────────────────────────
  if (/objetivo|indicador|meta|kpi|avance|cumplimiento|logrado/i.test(q)) {
    const ois = await prisma.$queryRaw<OIRow[]>`
      SELECT numero, objetivo, indicador, programa, estado, "valorActual", meta, unidad FROM "ObjetivoIndicador"
      ORDER BY estado ASC, numero ASC LIMIT 8`;
    if (ois.length > 0) {
      parts.push("**OBJETIVOS E INDICADORES:**\n" + ois.map(r => {
        const pct = r.meta > 0 ? Math.round((r.valorActual / r.meta) * 100) : 0;
        return `- OI-${String(r.numero).padStart(3,"0")} [${r.programa}] ${r.objetivo} — ${pct}% (${r.valorActual}/${r.meta} ${r.unidad}) · ${r.estado}`;
      }).join("\n"));
    }
  }

  // ── Auditorías ────────────────────────────────────────────────────────────
  if (/auditor|hallazgo|revision|iso|clausula|certific/i.test(q)) {
    const auds = await prisma.$queryRaw<AudRow[]>`
      SELECT numero, titulo, programa, estado, "noConformidades" FROM "AuditoriaInterna"
      ORDER BY "fechaPlan" DESC LIMIT 5`;
    if (auds.length > 0) {
      parts.push("**AUDITORÍAS:**\n" + auds.map(r =>
        `- AUD-${String(r.numero).padStart(3,"0")} [${r.programa}] ${r.titulo} — ${r.estado}${r.noConformidades > 0 ? ` (${r.noConformidades} NC)` : ""}`
      ).join("\n"));
    }
  }

  // ── Capacitaciones ────────────────────────────────────────────────────────
  if (/capacita|entrena|charla|curso|induccion|formac|competen/i.test(q)) {
    const caps = await prisma.$queryRaw<CapRow[]>`
      SELECT numero, titulo, estado, "fechaPlan", participantes FROM "Capacitacion"
      ORDER BY "fechaPlan" DESC LIMIT 6`;
    if (caps.length > 0) {
      parts.push("**CAPACITACIONES:**\n" + caps.map(r =>
        `- CAP-${String(r.numero).padStart(3,"0")} ${r.titulo} — ${r.estado} (${new Date(r.fechaPlan).toLocaleDateString("es-CL")}${r.participantes > 0 ? `, ${r.participantes} personas` : ""})`
      ).join("\n"));
    }
  }

  if (parts.length === 0) return "";
  return "\n\n---\n**DATOS DEL SISTEMA PURASAFE:**\n\n" + parts.join("\n\n") + "\n---";
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
  const context = await fetchContext(lastUserMsg).catch(() => "");

  const augmented = messages.map((m, i) =>
    i === messages.length - 1 && m.role === "user"
      ? { ...m, content: m.content + context }
      : m
  );

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
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
