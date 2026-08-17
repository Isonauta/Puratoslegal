import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fullPermitSchema } from "@/lib/pts/validations";
import type { UserRole } from "@/generated/prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = session.id;
  const role = (session.role ?? "ADMIN") as UserRole;

  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { listPermitsForUser } = await import("@/lib/pts/permitQueries");
  const permits = await listPermitsForUser(userId, role);
  return NextResponse.json(permits);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = session.id;

  const body = await req.json();
  const parsed = fullPermitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const data = parsed.data;

  let company = await prisma.company.findFirst({ where: { rut: data.companyRut } });
  if (!company) {
    company = await prisma.company.create({ data: { rut: data.companyRut, name: data.companyRut } });
  }

  const permit = await prisma.workPermit.create({
    data: {
      solicitanteId: userId,
      companyId: company.id,
      companyRut: data.companyRut,
      supervisorId: data.supervisorId ?? null,
      date: new Date(data.date),
      area: data.area,
      shift: data.shift,
      startTime: new Date(`${data.date}T${data.startTime}`),
      endTime: new Date(`${data.date}T${data.endTime}`),
      taskDescription: data.taskDescription,
      contractorCompany: data.contractorCompany ?? null,
      workerCount: data.workerCount ?? 0,
      permitTypes: data.permitTypes,
      permitTypeOtherText: data.permitTypeOtherText ?? null,
      hazards: data.hazards,
      hazardOtherText: data.hazardOtherText ?? null,
      controlMeasures: data.controlMeasures,
      controlMeasureOtherText: data.controlMeasureOtherText ?? null,
      ppeRequired: data.ppeRequired,
      ppeGlovesType: data.ppeGlovesType ?? null,
      ppeOtherText: data.ppeOtherText ?? null,
      ppeObservations: data.ppeObservations ?? null,
      status: "BORRADOR",
      atmosphereReadings: {
        create: (data.atmosphereReadings ?? []).map((r) => ({
          gas: r.gas,
          reading1: r.reading1 ?? null,
          reading2: r.reading2 ?? null,
          reading3: r.reading3 ?? null,
          instrument: r.instrument ?? null,
          responsibleName: r.responsibleName ?? null,
        })),
      },
      workers: {
        create: (data.workers ?? []).map((w, i) => ({
          order: i + 1,
          fullName: w.fullName,
          rut: w.rut,
          position: w.position,
          company: w.company,
          hasAltitudeMedicalCert: w.hasAltitudeMedicalCert ?? false,
          altitudeMedicalCertExpiry: w.altitudeMedicalCertExpiry ? new Date(w.altitudeMedicalCertExpiry) : null,
          inductionCompleted: w.inductionCompleted ?? false,
          signatureImage: w.signatureImage ?? null,
        })),
      },
    },
  });

  return NextResponse.json(permit, { status: 201 });
}
