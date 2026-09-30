import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const estado = req.nextUrl.searchParams.get("estado");
  const items = await prisma.gestionCambio.findMany({
    where: estado ? { estado } : undefined,
    include: { historial: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const {
    tipoCambio, naturalezaCambio, categoria, area, descripcion, motivo,
    fechaImplementacionPrevista, esSignificativo, solicitanteNombre,
  } = body;

  if (!descripcion || !area) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const anio = new Date().getFullYear();
  const delAnio = await prisma.gestionCambio.count({
    where: { codigo: { startsWith: `CAM-${anio}-` } },
  });
  const codigo = `CAM-${anio}-${String(delAnio + 1).padStart(3, "0")}`;

  const item = await prisma.$transaction(async (tx) => {
    const creado = await tx.gestionCambio.create({
      data: {
        codigo,
        tipoCambio: tipoCambio || null,
        naturalezaCambio: naturalezaCambio || null,
        categoria: categoria || null,
        area,
        descripcion,
        motivo: motivo || null,
        fechaImplementacionPrevista: fechaImplementacionPrevista ? new Date(fechaImplementacionPrevista) : null,
        esSignificativo: !!esSignificativo,
        solicitanteNombre: solicitanteNombre || session.email || null,
        createdBy: session.email ?? null,
      },
    });
    await tx.cambioHistorial.create({
      data: {
        cambioId: creado.id,
        paso: "Registro",
        estadoAnterior: null,
        estadoNuevo: "Solicitado",
        comentario: "Cambio solicitado y registrado.",
        realizadoPor: session.email ?? null,
      },
    });
    return tx.gestionCambio.findUniqueOrThrow({
      where: { id: creado.id },
      include: { historial: { orderBy: { createdAt: "asc" } } },
    });
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, accion, ...campos } = body;
  if (!id || !accion) return NextResponse.json({ error: "Falta id o acción" }, { status: 400 });

  const actual = await prisma.gestionCambio.findUnique({ where: { id } });
  if (!actual) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const quien = campos.realizadoPor || session.email || "Sistema";
  const estadoAnterior = actual.estado;

  let data: Record<string, unknown> = {};
  let paso = "";
  let estadoNuevo = estadoAnterior;
  let comentarioHist: string | null = null;

  switch (accion) {
    case "evaluar":
      data = {
        peligrosIdentificados: campos.peligrosIdentificados || null,
        riesgosEvaluados: campos.riesgosEvaluados || null,
        controlesPropuestos: campos.controlesPropuestos || null,
        evaluadoPor: campos.evaluadoPor || null,
        fechaEvaluacion: new Date(),
        estado: "En evaluación",
      };
      paso = "Evaluación";
      estadoNuevo = "En evaluación";
      break;

    case "autorizar":
      if (!campos.autorizadoPor) return NextResponse.json({ error: "Indica quién autoriza el cambio" }, { status: 400 });
      data = {
        autorizadoPor: campos.autorizadoPor,
        comentarioAutorizacion: campos.comentarioAutorizacion || null,
        fechaAutorizacion: new Date(),
        estado: "Autorizado",
      };
      paso = "Autorización";
      estadoNuevo = "Autorizado";
      break;

    case "rechazar":
      data = { estado: "Rechazado" };
      paso = "Autorización";
      estadoNuevo = "Rechazado";
      comentarioHist = campos.comentarioAutorizacion || "Cambio rechazado.";
      break;

    case "actualizar_planes":
      data = {
        requiereCapacitacion: !!campos.requiereCapacitacion,
        requiereProcedimientos: !!campos.requiereProcedimientos,
        requiereMatrizRiesgos: !!campos.requiereMatrizRiesgos,
        detalleActualizacion: campos.detalleActualizacion || "Sin observaciones adicionales",
        responsableActualizacion: campos.responsableActualizacion || null,
      };
      paso = "Actualización de planes";
      break;

    case "implementar":
      data = {
        fechaImplementacion: campos.fechaImplementacion ? new Date(campos.fechaImplementacion) : new Date(),
        seguimiento: campos.seguimiento || null,
        responsableImplementacion: campos.responsableImplementacion || null,
        estado: "Implementado",
      };
      paso = "Implementación";
      estadoNuevo = "Implementado";
      break;

    case "validar_eficaz":
      data = {
        eficaz: true,
        validadoPor: campos.validadoPor || null,
        observacionesValidacion: campos.observacionesValidacion || null,
        fechaValidacion: new Date(),
        estado: "Cerrado",
      };
      paso = "Validación";
      estadoNuevo = "Cerrado";
      break;

    case "validar_no_eficaz": {
      const nuevoCiclo = (actual.cicloRevision || 1) + 1;
      data = {
        eficaz: false,
        validadoPor: campos.validadoPor || null,
        observacionesValidacion: campos.observacionesValidacion || null,
        fechaValidacion: new Date(),
        estado: "En evaluación",
        cicloRevision: nuevoCiclo,
      };
      paso = "Validación";
      estadoNuevo = "En evaluación";
      comentarioHist = `No fue eficaz — vuelve a evaluación de impacto (ciclo ${nuevoCiclo}).`;
      break;
    }

    default:
      return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  }

  const item = await prisma.$transaction(async (tx) => {
    const actualizado = await tx.gestionCambio.update({ where: { id }, data });
    await tx.cambioHistorial.create({
      data: {
        cambioId: id,
        paso,
        estadoAnterior,
        estadoNuevo,
        comentario: comentarioHist,
        realizadoPor: quien,
      },
    });
    return tx.gestionCambio.findUniqueOrThrow({
      where: { id },
      include: { historial: { orderBy: { createdAt: "asc" } } },
    });
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await prisma.gestionCambio.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
