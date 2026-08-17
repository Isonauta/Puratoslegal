import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/client";
import PtsNavBar from "@/components/pts/NavBar";
import {
  PERMIT_TYPE_LABELS,
  POTENTIAL_INCIDENT_LABELS,
  CONTROL_MEASURE_LABELS,
  PPE_LABELS,
} from "@/lib/pts/labels";

export const dynamic = "force-dynamic";

export default async function AtsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?from=/pts/ats/${id}`);

  const role = (session.role ?? "ADMIN") as UserRole;

  const ats = await prisma.aTS.findUnique({
    where: { id },
    include: { steps: true, workers: true, workPermit: true },
  });

  if (!ats) notFound();

  return (
    <>
      <PtsNavBar userName={session.name ?? undefined} userRole={role} />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          {ats.workPermitId ? (
            <Link href={`/pts/permits/${ats.workPermitId}`} className="text-sm text-gray-500 hover:text-gray-700">← Volver al permiso</Link>
          ) : (
            <Link href="/pts" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h1 className="text-xl font-bold">ATS – Análisis de Trabajo Seguro</h1>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Empresa</dt>
              <dd className="font-medium">{ats.companyName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Área</dt>
              <dd className="font-medium">{ats.area}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Fecha</dt>
              <dd className="font-medium">{ats.date ? new Date(ats.date).toLocaleDateString("es-CL") : "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Horario</dt>
              <dd className="font-medium">{new Date(ats.startTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} – {new Date(ats.endTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</dd>
            </div>
            {ats.supervisorValidatesName && (
              <div className="col-span-2">
                <dt className="text-gray-500">Supervisor que valida</dt>
                <dd className="font-medium">{ats.supervisorValidatesName} {ats.supervisorValidatesRut ? `· ${ats.supervisorValidatesRut}` : ""}</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-gray-500">Descripción del trabajo</dt>
              <dd className="font-medium">{ats.taskDescription}</dd>
            </div>
          </dl>
        </div>

        {ats.highRiskProcedures.length > 0 && (
          <Section title="Procedimientos especiales de alto riesgo">
            <TagList items={ats.highRiskProcedures.map((p) => PERMIT_TYPE_LABELS[p] ?? p)} />
          </Section>
        )}

        {ats.potentialIncidents.length > 0 && (
          <Section title="Incidentes potenciales">
            <TagList items={ats.potentialIncidents.map((p) => POTENTIAL_INCIDENT_LABELS[p] ?? p)} />
          </Section>
        )}

        {ats.controlMeasures.length > 0 && (
          <Section title="Controles para evitar accidentes">
            <TagList items={ats.controlMeasures.map((c) => CONTROL_MEASURE_LABELS[c] ?? c)} />
          </Section>
        )}

        {ats.ppeRequired.length > 0 && (
          <Section title="EPP requerido">
            <TagList items={ats.ppeRequired.map((p) => PPE_LABELS[p] ?? p)} />
          </Section>
        )}

        {ats.steps.length > 0 && (
          <Section title="Pasos del análisis">
            <div className="space-y-3">
              {ats.steps.map((step, i) => (
                <div key={step.id} className="border border-gray-100 rounded-lg p-3 space-y-1 text-sm">
                  <p className="font-medium text-gray-800">Paso {i + 1}: {step.taskStage}</p>
                  <p className="text-gray-600"><span className="font-medium">Peligros:</span> {step.hazardsExposed}</p>
                  <p className="text-gray-600"><span className="font-medium">Incidentes potenciales:</span> {step.potentialIncidents}</p>
                  <p className="text-gray-600"><span className="font-medium">Controles:</span> {step.controls}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {ats.workers.length > 0 && (
          <Section title="Trabajadores">
            <div className="space-y-3">
              {ats.workers.map((worker) => (
                <div key={worker.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{worker.fullName}</p>
                    <p className="text-xs text-gray-500">{worker.rut}</p>
                  </div>
                  {worker.signatureImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={worker.signatureImage} alt="Firma" className="h-12 border rounded bg-white object-contain" />
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
          {item}
        </span>
      ))}
    </div>
  );
}
