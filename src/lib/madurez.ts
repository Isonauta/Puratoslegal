// Lógica de puntaje del módulo "Madurez OpX" (framework Puratos, pilar
// Health and Safety) — ver prisma/schema.prisma (MaturityItem/Criterio/
// Evaluacion/Respuesta) y la planilla fuente "OpX Maturity Pyramid".
//
// Nivel de la pirámide: 1=Basics, 2=Systems, 3=Capabilities, 4=Culture
// (etiquetas propias del framework, fijas — no vienen de datos del cliente).
export const NIVEL_LABELS: Record<number, string> = {
  1: "Basics",
  2: "Systems",
  3: "Capabilities",
  4: "Culture",
};

export type Criterio = { id: string; itemId: string; paso: number; nombrePaso: string; textoEn: string; textoEs: string };
export type Item = { id: string; codigo: string; titulo: string; workstream: string; nivel: number; orden: number; frecuencia: string | null; criterios: Criterio[] };
export type Respuesta = { id: string; evaluacionId: string; criterioId: string; itemId: string; valor: number | null; observaciones: string | null };

export type Banda = { label: string; dot: string; border: string; bg: string; text: string };

// Bandas calcadas de la planilla fuente (fila 28 de "OpX Pyramid - As Is"):
// Not Evaluated | <20% No standard | 20-40% Defined | 40-60% Developed |
// 60-80% Installed | 80-100% Mastered | 100% Sustained.
// `border` se declara aparte (en vez de derivarlo de `dot` con un reemplazo
// de string) porque Tailwind sólo genera el CSS de las clases que aparecen
// literalmente en el código fuente — una clase armada en runtime no se
// incluiría en el build.
export function banda(pct: number | null): Banda {
  if (pct === null) return { label: "Sin evaluar", dot: "bg-zinc-300", border: "border-zinc-300", bg: "bg-zinc-50", text: "text-zinc-500" };
  if (pct >= 100) return { label: "Sostenido", dot: "bg-emerald-600", border: "border-emerald-600", bg: "bg-emerald-50", text: "text-emerald-700" };
  if (pct >= 80) return { label: "Dominado", dot: "bg-emerald-400", border: "border-emerald-400", bg: "bg-emerald-50/60", text: "text-emerald-600" };
  if (pct >= 60) return { label: "Instalado", dot: "bg-amber-400", border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-600" };
  if (pct >= 40) return { label: "Desarrollado", dot: "bg-orange-400", border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-600" };
  if (pct >= 20) return { label: "Definido", dot: "bg-orange-500", border: "border-orange-500", bg: "bg-orange-50", text: "text-orange-700" };
  return { label: "Sin estándar", dot: "bg-red-500", border: "border-red-500", bg: "bg-red-50", text: "text-red-600" };
}

function mean(vals: number[]): number | null {
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function respuestaMapFor(respuestas: Respuesta[]): Map<string, Respuesta> {
  return new Map(respuestas.map((r) => [r.criterioId, r]));
}

// Porcentaje (0-100) de un ítem sobre sus 5 criterios. Un criterio sin
// respuesta (N.E.) cuenta como 0 en la suma (no se excluye del promedio) —
// de lo contrario, marcar un solo criterio en "1" y dejar los otros 4 sin
// contestar haría saltar el ítem a 100% de inmediato. Solo cuando NINGÚN
// criterio fue contestado el ítem se considera "Sin evaluar" (null) en vez
// de 0%, ya que son estados distintos: "no sabemos" vs "lo evaluamos y no
// cumple nada".
export function itemScore(item: Item, respuestaMap: Map<string, Respuesta>): number | null {
  const valores = item.criterios.map((c) => respuestaMap.get(c.id)?.valor);
  const contestados = valores.filter((v): v is number => v !== null && v !== undefined);
  if (contestados.length === 0) return null;
  const suma = valores.reduce((acc: number, v) => acc + (v ?? 0), 0);
  return (suma / item.criterios.length) * 100;
}

export function nivelScore(items: Item[], nivel: number, respuestaMap: Map<string, Respuesta>): number | null {
  const scores = items
    .filter((i) => i.nivel === nivel)
    .map((i) => itemScore(i, respuestaMap))
    .filter((s): s is number => s !== null);
  return mean(scores);
}

export function workstreamScore(items: Item[], workstream: string, respuestaMap: Map<string, Respuesta>): number | null {
  const scores = items
    .filter((i) => i.workstream === workstream)
    .map((i) => itemScore(i, respuestaMap))
    .filter((s): s is number => s !== null);
  return mean(scores);
}

// Score global = promedio simple de los 4 niveles (cada nivel pesa igual,
// sin importar cuántos ítems tenga) — elección de diseño propia, distinta
// de la fórmula original de la planilla (que sumaba las 120 celdas de
// criterio incluyendo, por un detalle de esa plantilla, también el valor
// "SIS" de cada fila de encabezado — no se replica ese detalle acá).
export function overallScore(items: Item[], respuestaMap: Map<string, Respuesta>): number | null {
  const niveles = [1, 2, 3, 4].map((n) => nivelScore(items, n, respuestaMap)).filter((s): s is number => s !== null);
  return mean(niveles);
}

export function isPendiente(item: Item, respuestaMap: Map<string, Respuesta>): boolean {
  const s = itemScore(item, respuestaMap);
  return s === null || s < 100;
}
