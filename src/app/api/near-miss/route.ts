import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isNearMissReviewer, NEAR_MISS_AREAS, NEAR_MISS_CONSECUENCIAS, NEAR_MISS_DESCRIPCION_MAX } from "@/lib/nearMiss";
import { checkNearMissRateLimit } from "@/lib/rateLimiter";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// GET: listado para triage — solo encargados SIG asignados (no requiere isAdmin,
// es un grupo propio e independiente del flag de admin de la plataforma).
export async function GET() {
  const session = await getSession();
  if (!isNearMissReviewer(session?.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const items = await prisma.nearMiss.findMany({
    orderBy: [{ estado: "asc" }, { fecha: "desc" }],
  });
  return NextResponse.json(items);
}

// POST: envío público, sin sesión — cualquiera que escanee el QR puede reportar.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfterSecs } = checkNearMissRateLimit(ip);
  if (!allowed) {
    const mins = Math.ceil((retryAfterSecs ?? 3600) / 60);
    return NextResponse.json(
      { error: `Demasiados envíos desde esta conexión. Intenta de nuevo en ${mins} minutos.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  const { fecha, nombreReporta, areaReporta, titulo, descripcion, consecuencia, medidaInmediata } = body;

  if (!fecha || !nombreReporta || !areaReporta || !titulo || !descripcion || !consecuencia || typeof medidaInmediata !== "boolean") {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }
  if (!NEAR_MISS_AREAS.includes(areaReporta)) {
    return NextResponse.json({ error: "Área inválida" }, { status: 400 });
  }
  if (!NEAR_MISS_CONSECUENCIAS.includes(consecuencia)) {
    return NextResponse.json({ error: "Consecuencia inválida" }, { status: 400 });
  }
  if (typeof descripcion !== "string" || descripcion.length > NEAR_MISS_DESCRIPCION_MAX) {
    return NextResponse.json({ error: `La descripción no puede superar los ${NEAR_MISS_DESCRIPCION_MAX} caracteres` }, { status: 400 });
  }
  const fechaParsed = new Date(fecha);
  if (Number.isNaN(fechaParsed.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const creado = await prisma.nearMiss.create({
    data: {
      fecha: fechaParsed,
      nombreReporta: String(nombreReporta).slice(0, 200),
      areaReporta,
      titulo: String(titulo).slice(0, 200),
      descripcion,
      consecuencia,
      medidaInmediata,
    },
  });

  return NextResponse.json({ ok: true, numero: creado.numero }, { status: 201 });
}

// PATCH: acciones de triage — solo encargados SIG asignados.
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!isNearMissReviewer(session?.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { id, accion, prioridad, comentario } = body;
  if (!id || !accion) return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });

  const existente = await prisma.nearMiss.findUnique({ where: { id } });
  if (!existente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  if (accion === "tomar") {
    const actualizado = await prisma.nearMiss.update({
      where: { id },
      data: {
        estado: "En triage",
        triagePor: session!.email,
        triageFecha: new Date(),
        ...(prioridad ? { prioridad } : {}),
      },
    });
    return NextResponse.json(actualizado);
  }

  if (accion === "actualizar") {
    const actualizado = await prisma.nearMiss.update({
      where: { id },
      data: {
        ...(prioridad ? { prioridad } : {}),
        ...(comentario !== undefined ? { triageComentario: comentario } : {}),
      },
    });
    return NextResponse.json(actualizado);
  }

  if (accion === "cerrar") {
    const actualizado = await prisma.nearMiss.update({
      where: { id },
      data: {
        estado: "Cerrado",
        ...(comentario !== undefined ? { triageComentario: comentario } : {}),
      },
    });
    return NextResponse.json(actualizado);
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
