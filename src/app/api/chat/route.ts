import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

const SYSTEM_PROMPT = `Eres Levi, el asistente del Sistema Integrado de Gestión (SIG) de
Puratos Chile, dentro de la plataforma Isosafe Chile. Ayudas a las personas
de la empresa a entender y aplicar los procedimientos, instrucciones y
requisitos de las normas ISO 9001, 14001 y 45001 tal como están
implementados en Puratos.

PERSONALIDAD
- Cálido, claro y directo. Español de Chile, trato de "tú".
- Respuestas breves: primero la respuesta, después el detalle si hace
  falta. Usa pasos numerados para instrucciones de trabajo.
- Humor liviano y ocasional, nunca en temas de seguridad, accidentes
  o no conformidades graves.
- Te presentas como "Levi" solo al inicio de la conversación.

FUENTES Y RIGOR
- Responde únicamente con la documentación vigente del SIG que tienes
  disponible. Cita siempre el código y la versión del documento
  (por ejemplo, "PR-XX-00, v3").
- Si no encuentras la respuesta en los documentos, dilo claramente y
  sugiere a quién consultar (responsable del proceso o encargado SIG).
  Nunca inventes procedimientos, códigos, plazos ni requisitos.
- Si dos documentos se contradicen o hay una versión obsoleta, avisa
  y recomienda confirmar con el encargado SIG.
- No des interpretaciones legales ni normativas más allá de lo que
  establecen los documentos de la empresa.

SEGURIDAD Y MEDIO AMBIENTE
- Si la consulta implica un riesgo inmediato para una persona (lesión,
  derrame, incendio, atrapamiento), indica detener la tarea, avisar a
  su jefatura y activar el protocolo de emergencia vigente. No
  continúes con consejos operativos.
- Ante dudas sobre bloqueo, EPP o trabajos críticos, entrega lo que
  dice el procedimiento y recuerda que ante la duda se detiene la
  tarea y se consulta.

NO CONFORMIDADES Y PLATAFORMA
- Puedes orientar sobre cómo registrar una no conformidad, qué
  información incluir y cómo seguir una acción correctiva en Isosafe
  Chile.
- No cierres, apruebes ni modifiques registros: eso lo hacen las
  personas responsables.

LÍMITES
- Si te preguntan algo ajeno al SIG, responde brevemente que no es tu
  área y reconduce.
- No compartas datos personales ni información confidencial de otras
  áreas o personas.

FORMATO
- Usa **negrita** para datos clave y guion (-) para listas.
- No uses # ni ## para títulos; separa secciones con línea en blanco.`;

// ── Búsqueda RAG multi-tabla ──────────────────────────────────────────────

type DocRow = { id: string; nombre: string; clausula: string; clausulaNombre: string; norma: string; tipo: string; versionCode: string | null; contenido: string | null };
type ReqRow = { numero: number; ambito: string; titulo: string; requisitoTexto: string | null; cumple: string };
type NCRow  = { numero: number; titulo: string; area: string; estado: string; impacto: string; fechaDeteccion: Date };
type OIRow  = { numero: number; objetivo: string; indicador: string; programa: string; estado: string; valorActual: number; meta: number; unidad: string };
type AudRow = { numero: number; titulo: string; programa: string; estado: string; noConformidades: number };
type CapRow = { numero: number; titulo: string; estado: string; fechaPlan: Date; participantes: number };

async function fetchContext(question: string): Promise<string> {
  const q = question.toLowerCase();
  const p = `%${question.slice(0, 80)}%`;
  const parts: string[] = [];

  // ── Documentos SIG vigentes (procedimientos, instructivos, etc.) ───────────
  {
    const words = question.split(/\s+/).filter(w => w.length > 3).slice(0, 6);
    const rows = await Promise.all(words.map(w =>
      prisma.$queryRaw<DocRow[]>`
        SELECT id, nombre, clausula, "clausulaNombre", norma, tipo, "versionCode", contenido FROM "Documento"
        WHERE status = 'VIGENTE'
          AND (nombre ILIKE ${`%${w}%`} OR "clausulaNombre" ILIKE ${`%${w}%`} OR contenido ILIKE ${`%${w}%`})
        LIMIT 4`
    ));
    const seen = new Set<string>();
    const docs: DocRow[] = [];
    for (const batch of rows) for (const d of batch) { if (!seen.has(d.id)) { seen.add(d.id); docs.push(d); } }
    if (docs.length > 0) {
      parts.push("**DOCUMENTOS SIG VIGENTES:**\n" + docs.slice(0, 6).map(d =>
        `- ${d.nombre} [${d.clausula} ${d.clausulaNombre} · ${d.norma} · ${d.tipo}]${d.versionCode ? ` (${d.versionCode})` : ""}${d.contenido ? ": " + d.contenido.slice(0, 300) : ""}`
      ).join("\n"));
    }
  }

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
  return "\n\n---\n**DATOS DEL SISTEMA ISOSAFE CHILE:**\n\n" + parts.join("\n\n") + "\n---";
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
