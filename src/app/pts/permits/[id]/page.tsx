import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/client";
import PtsNavBar from "@/components/pts/NavBar";
import PermitActions from "@/components/pts/PermitActions";
import PrintButton from "@/components/pts/PrintButton";
import {
  PERMIT_STATUS_LABELS,
  PERMIT_STATUS_COLORS,
  PERMIT_TYPE_LABELS,
  HAZARD_LABELS,
  CONTROL_MEASURE_LABELS,
  PPE_LABELS,
  SHIFT_LABELS,
  SIGNATURE_ROLE_LABELS,
} from "@/lib/pts/labels";

export const dynamic = "force-dynamic";

export default async function PermitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?from=/pts/permits/${id}`);

  const role = (session.role ?? "ADMIN") as UserRole;

  const permit = await prisma.workPermit.findUnique({
    where: { id },
    include: {
      company: true,
      solicitante: true,
      supervisor: true,
      workers: true,
      atmosphereReadings: true,
      signatures: { include: { user: true } },
      statusLogs: { include: { changedBy: true }, orderBy: { createdAt: "asc" } },
      atsList: { include: { steps: true, workers: true } },
    },
  });

  if (!permit) notFound();

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm 12mm; }
          .pts-navbar, .pts-actions, .print-hide { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          main { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .print-section {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;
            box-shadow: none !important;
            margin-bottom: 8px !important;
            padding: 12px !important;
          }
          .print-section h2 { font-size: 11px; font-weight: 700; margin-bottom: 6px; color: #374151; }
          .space-y-6 > * + * { margin-top: 8px !important; }
          /* Firmas: 2×2 grid fijo, nunca se rompe */
          .firmas-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .firmas-grid img { max-height: 60px !important; width: auto !important; }
          /* Encabezado del documento */
          .print-header {
            display: flex !important;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #111827;
          }
          .print-header-hide { display: none !important; }
        }
        @media screen {
          .print-header { display: none; }
        }
      `}</style>
      <div className="pts-navbar"><PtsNavBar userName={session.name ?? undefined} userRole={role} /></div>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Encabezado solo visible al imprimir */}
        <div className="print-header">
          <div>
            <p className="font-bold text-lg">Permiso de Trabajo Seguro</p>
            <p className="text-sm text-gray-600">{permit.taskDescription}</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Purasafe — Cumplimiento Legal</p>
            <p>{permit.date ? new Date(permit.date).toLocaleDateString("es-CL") : ""}</p>
            <p className="mt-1 font-medium">{PERMIT_STATUS_LABELS[permit.status] ?? permit.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pts" className="text-sm text-gray-500 hover:text-gray-700 print-hide">← Volver</Link>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              PERMIT_STATUS_COLORS[permit.status] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {PERMIT_STATUS_LABELS[permit.status] ?? permit.status}
          </span>
        </div>

        <div className="print-section bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h1 className="text-xl font-bold print:text-base">{permit.taskDescription}</h1>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Empresa</dt>
              <dd className="font-medium">{permit.company?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Área</dt>
              <dd className="font-medium">{permit.area}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Fecha</dt>
              <dd className="font-medium">{permit.date ? new Date(permit.date).toLocaleDateString("es-CL") : "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Turno</dt>
              <dd className="font-medium">{SHIFT_LABELS[permit.shift] ?? permit.shift}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Horario</dt>
              <dd className="font-medium">{new Date(permit.startTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} – {new Date(permit.endTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Solicitante</dt>
              <dd className="font-medium">{permit.solicitante?.name ?? "—"}</dd>
            </div>
            {permit.supervisor && (
              <div>
                <dt className="text-gray-500">Supervisor</dt>
                <dd className="font-medium">{permit.supervisor.name}</dd>
              </div>
            )}
          </dl>
        </div>

        <Section title="Tipos de permiso">
          <TagList items={permit.permitTypes.map((t) => PERMIT_TYPE_LABELS[t] ?? t)} />
          {permit.permitTypeOtherText && <p className="text-sm mt-1 text-gray-600">{permit.permitTypeOtherText}</p>}
        </Section>

        <Section title="Peligros identificados">
          <TagList items={permit.hazards.map((h) => HAZARD_LABELS[h] ?? h)} />
        </Section>

        <Section title="Medidas de control">
          <TagList items={permit.controlMeasures.map((c) => CONTROL_MEASURE_LABELS[c] ?? c)} />
        </Section>

        <Section title="EPP requerido">
          <TagList items={permit.ppeRequired.map((p) => PPE_LABELS[p] ?? p)} />
          {permit.ppeGlovesType && <p className="text-sm mt-1 text-gray-600">Guantes: {permit.ppeGlovesType}</p>}
          {permit.ppeObservations && <p className="text-sm mt-1 text-gray-600">{permit.ppeObservations}</p>}
        </Section>

        {permit.atmosphereReadings.length > 0 && (
          <Section title="Lecturas de atmósfera">
            <div className="overflow-x-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-1 pr-4">Gas</th>
                    <th className="pb-1 pr-4">Lect. 1</th>
                    <th className="pb-1 pr-4">Lect. 2</th>
                    <th className="pb-1 pr-4">Lect. 3</th>
                    <th className="pb-1">Instrumento</th>
                  </tr>
                </thead>
                <tbody>
                  {permit.atmosphereReadings.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1 pr-4 font-medium">{r.gas}</td>
                      <td className="py-1 pr-4">{r.reading1 ?? "—"}</td>
                      <td className="py-1 pr-4">{r.reading2 ?? "—"}</td>
                      <td className="py-1 pr-4">{r.reading3 ?? "—"}</td>
                      <td className="py-1">{r.instrument ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {permit.workers.length > 0 && (
          <Section title="Nómina de trabajadores">
            <div className="space-y-2">
              {permit.workers.map((w, i) => (
                <div key={i} className="text-sm flex justify-between">
                  <span>{w.fullName}</span>
                  <span className="text-gray-500">{w.rut} · {w.position}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {permit.signatures.length > 0 && (
          <Section title="Firmas">
            <div className="firmas-grid grid grid-cols-2 gap-3">
              {permit.signatures.map((sig) => (
                <div key={sig.id} className="border border-gray-200 rounded-lg p-3 space-y-1">
                  <p className="text-xs text-gray-500 font-medium">{SIGNATURE_ROLE_LABELS[sig.role] ?? sig.role}</p>
                  <p className="text-sm font-semibold">{sig.user?.name ?? "—"}</p>
                  <div className="h-20 border border-gray-100 rounded bg-white flex items-center justify-center">
                    {sig.imageData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sig.imageData} alt="Firma" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-300">Sin firma</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {permit.statusLogs.length > 0 && (
          <Section title="Historial">
            <ol className="text-sm space-y-1">
              {permit.statusLogs.map((log) => (
                <li key={log.id} className="flex gap-2 text-gray-600">
                  <span className="text-gray-400 shrink-0">{new Date(log.createdAt).toLocaleString("es-CL")}</span>
                  <span>{log.changedBy?.name ?? "—"} → {PERMIT_STATUS_LABELS[log.toStatus] ?? log.toStatus}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {permit.atsList.length > 0 && (
          <Section title="ATS asociados">
            <div className="space-y-2">
              {permit.atsList.map((ats) => (
                <Link
                  key={ats.id}
                  href={`/pts/ats/${ats.id}`}
                  className="block text-sm text-[#C41230] hover:underline"
                >
                  ATS – {ats.companyName} · {ats.area}
                </Link>
              ))}
            </div>
          </Section>
        )}

        <div className="flex gap-3 print-hide">
          <Link
            href={`/pts/ats/new?permitId=${permit.id}`}
            className="text-sm text-[#C41230] hover:underline"
          >
            + Crear ATS para este permiso
          </Link>
          <PrintButton />
        </div>

        {session.id && (
          <div className="pts-actions">
            <PermitActions permitId={permit.id} status={permit.status} role={role} />
          </div>
        )}
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="print-section bg-white border border-gray-200 rounded-xl p-5 space-y-3">
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
