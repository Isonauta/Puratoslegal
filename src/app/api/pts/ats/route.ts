import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { atsSchema } from "@/lib/pts/validations";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = atsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const data = parsed.data;

  const ats = await prisma.aTS.create({
    data: {
      responsibleId: session.id,
      workPermitId: data.workPermitId ?? null,
      companyName: data.companyName,
      area: data.area,
      date: new Date(data.date),
      startTime: new Date(`${data.date}T${data.startTime}`),
      endTime: new Date(`${data.date}T${data.endTime}`),
      taskDescription: data.taskDescription,
      supervisorValidatesName: data.supervisorValidatesName ?? null,
      supervisorValidatesRut: data.supervisorValidatesRut ?? null,
      highRiskProcedures: data.highRiskProcedures ?? [],
      potentialIncidents: data.potentialIncidents ?? [],
      potentialIncidentOther: data.potentialIncidentOther ?? null,
      controlMeasures: data.controlMeasures ?? [],
      controlMeasureOther: data.controlMeasureOther ?? null,
      ppeRequired: data.ppeRequired ?? [],
      ppeOtherText: data.ppeOtherText ?? null,
      steps: {
        create: (data.steps ?? []).map((s, i) => ({
          order: i + 1,
          taskStage: s.taskStage,
          hazardsExposed: s.hazardsExposed,
          potentialIncidents: s.potentialIncidents,
          controls: s.controls,
        })),
      },
      workers: {
        create: (data.workers ?? []).map((w, i) => ({
          order: i + 1,
          fullName: w.fullName,
          rut: w.rut,
          medicalCertExpiry: w.medicalCertExpiry ? new Date(w.medicalCertExpiry) : null,
          signatureImage: w.signatureImage ?? null,
        })),
      },
    },
  });

  return NextResponse.json(ats, { status: 201 });
}
