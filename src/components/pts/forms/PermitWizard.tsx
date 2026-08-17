"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { fullPermitSchema, FullPermitInput } from "@/lib/pts/validations";
import {
  PERMIT_TYPE_LABELS,
  HAZARD_LABELS,
  CONTROL_MEASURE_LABELS,
  PPE_LABELS,
  GAS_LABELS,
  GAS_LIMITS,
  SHIFT_LABELS,
} from "@/lib/pts/labels";
import type { GasType } from "@/generated/prisma/client";
import CheckboxGroup from "@/components/pts/ui/CheckboxGroup";
import Button from "@/components/pts/ui/Button";
import SignaturePad from "@/components/pts/signature/SignaturePad";

const STEPS = [
  "Datos generales",
  "Tipo de permiso",
  "Peligros",
  "Medidas de control",
  "EPP",
  "Atmósfera",
  "Nómina de trabajadores",
  "Revisión y envío",
];

const GASES: GasType[] = ["O2", "CO", "H2S", "LEL"];

function isOutOfRange(gas: GasType, value: number | null | undefined): boolean {
  if (value === null || value === undefined || Number.isNaN(value)) return false;
  const limit = GAS_LIMITS[gas];
  if (limit.min !== undefined && value < limit.min) return true;
  if (limit.max !== undefined && value > limit.max) return true;
  return false;
}

export default function PermitWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FullPermitInput>({
    resolver: zodResolver(fullPermitSchema),
    defaultValues: {
      shift: "DIA",
      workerCount: 0,
      permitTypes: [],
      hazards: [],
      controlMeasures: [],
      ppeRequired: [],
      atmosphereReadings: GASES.map((gas) => ({ gas })),
      workers: [{ fullName: "", rut: "", position: "", company: "", hasAltitudeMedicalCert: false, inductionCompleted: false }],
    },
  });

  const workersArray = useFieldArray({ control, name: "workers" });
  const atmosphereArray = useFieldArray({ control, name: "atmosphereReadings" });

  const permitTypes = watch("permitTypes") || [];
  const hasConfinedSpace = permitTypes.includes("ESPACIO_CONFINADO");

  const stepFieldNames: Record<number, (keyof FullPermitInput)[]> = {
    0: ["companyRut", "date", "area", "shift", "startTime", "endTime", "taskDescription"],
    1: ["permitTypes"],
    2: ["hazards"],
    3: ["controlMeasures"],
    4: ["ppeRequired"],
    5: [],
    6: ["workers"],
  };

  async function goNext() {
    const fields = stepFieldNames[step];
    if (fields && fields.length > 0) {
      const valid = await trigger(fields as (keyof FullPermitInput)[]);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(data: FullPermitInput) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = { ...data, atmosphereReadings: hasConfinedSpace ? data.atmosphereReadings : [] };
      const res = await fetch("/api/pts/permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al crear el permiso");
      }
      const created = await res.json();
      router.push(`/pts/permits/${created.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  const allValues = watch();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((label, idx) => (
          <div
            key={label}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
              idx === step ? "bg-[#C41230] text-white" : idx < step ? "bg-red-50 text-[#9B0E26]" : "bg-gray-100 text-gray-400"
            }`}
          >
            {idx + 1}. {label}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Datos generales</h2>
            <Field label="RUT Empresa" error={errors.companyRut?.message}>
              <input className="input" {...register("companyRut")} placeholder="76.123.456-7" />
            </Field>
            <Field label="Fecha" error={errors.date?.message}>
              <input type="date" className="input" {...register("date")} />
            </Field>
            <Field label="Lugar / Área de trabajo" error={errors.area?.message}>
              <input className="input" {...register("area")} placeholder="Ej: Bodega de insumos" />
            </Field>
            <Field label="Turno" error={errors.shift?.message}>
              <select className="input" {...register("shift")}>
                {Object.entries(SHIFT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hora inicio" error={errors.startTime?.message}>
                <input type="time" className="input" {...register("startTime")} />
              </Field>
              <Field label="Hora término" error={errors.endTime?.message}>
                <input type="time" className="input" {...register("endTime")} />
              </Field>
            </div>
            <Field label="Descripción de la tarea" error={errors.taskDescription?.message}>
              <textarea className="input min-h-[90px]" {...register("taskDescription")} />
            </Field>
            <Field label="Empresa contratista (si aplica)">
              <input className="input" {...register("contractorCompany")} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">A. Tipo de permiso</h2>
            <Controller
              control={control}
              name="permitTypes"
              render={({ field }) => (
                <CheckboxGroup
                  options={Object.entries(PERMIT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
                  selected={field.value || []}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.permitTypes && <p className="text-sm text-red-600">{errors.permitTypes.message}</p>}
            {permitTypes.includes("OTRO") && (
              <Field label="Especificar otro">
                <input className="input" {...register("permitTypeOtherText")} />
              </Field>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">B. Peligros identificados</h2>
            <Controller
              control={control}
              name="hazards"
              render={({ field }) => (
                <CheckboxGroup
                  options={Object.entries(HAZARD_LABELS).map(([value, label]) => ({ value, label }))}
                  selected={field.value || []}
                  onChange={field.onChange}
                  columns={2}
                />
              )}
            />
            {errors.hazards && <p className="text-sm text-red-600">{errors.hazards.message}</p>}
            {watch("hazards")?.includes("OTRO") && (
              <Field label="Especificar otro peligro">
                <input className="input" {...register("hazardOtherText")} />
              </Field>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">C. Medidas de control</h2>
            <Controller
              control={control}
              name="controlMeasures"
              render={({ field }) => (
                <CheckboxGroup
                  options={Object.entries(CONTROL_MEASURE_LABELS).map(([value, label]) => ({ value, label }))}
                  selected={field.value || []}
                  onChange={field.onChange}
                  columns={2}
                />
              )}
            />
            {errors.controlMeasures && <p className="text-sm text-red-600">{errors.controlMeasures.message}</p>}
            {watch("controlMeasures")?.includes("OTRO") && (
              <Field label="Especificar otra medida">
                <input className="input" {...register("controlMeasureOtherText")} />
              </Field>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">D. EPP requeridos</h2>
            <Controller
              control={control}
              name="ppeRequired"
              render={({ field }) => (
                <CheckboxGroup
                  options={Object.entries(PPE_LABELS).map(([value, label]) => ({ value, label }))}
                  selected={field.value || []}
                  onChange={field.onChange}
                  columns={2}
                />
              )}
            />
            {errors.ppeRequired && <p className="text-sm text-red-600">{errors.ppeRequired.message}</p>}
            {watch("ppeRequired")?.includes("GUANTES") && (
              <Field label="Tipo de guantes">
                <input className="input" {...register("ppeGlovesType")} />
              </Field>
            )}
            {watch("ppeRequired")?.includes("OTRO") && (
              <Field label="Especificar otro EPP">
                <input className="input" {...register("ppeOtherText")} />
              </Field>
            )}
            <Field label="Observaciones EPP">
              <textarea className="input" {...register("ppeObservations")} />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">E. Medición de atmósfera - Espacio confinado</h2>
            {!hasConfinedSpace ? (
              <p className="text-sm text-gray-500">
                Solo aplica si seleccionaste &quot;Espacio Confinado&quot;. Puedes continuar.
              </p>
            ) : (
              <div className="space-y-4">
                {atmosphereArray.fields.map((field, idx) => {
                  const gas = field.gas as GasType;
                  const r1 = watch(`atmosphereReadings.${idx}.reading1`);
                  const r2 = watch(`atmosphereReadings.${idx}.reading2`);
                  const r3 = watch(`atmosphereReadings.${idx}.reading3`);
                  const danger = isOutOfRange(gas, r1 as number | null | undefined) || isOutOfRange(gas, r2 as number | null | undefined) || isOutOfRange(gas, r3 as number | null | undefined);
                  return (
                    <div key={field.id} className={`p-4 rounded-xl border space-y-2 ${danger ? "border-red-500 bg-red-50" : "border-gray-200 bg-white"}`}>
                      <p className="font-semibold">{GAS_LABELS[gas]}</p>
                      <p className="text-xs text-gray-500">{GAS_LIMITS[gas].description}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="number" step="0.1" placeholder="Antes ingreso" className="input" {...register(`atmosphereReadings.${idx}.reading1` as const, { valueAsNumber: true })} />
                        <input type="number" step="0.1" placeholder="30 min" className="input" {...register(`atmosphereReadings.${idx}.reading2` as const, { valueAsNumber: true })} />
                        <input type="number" step="0.1" placeholder="60 min" className="input" {...register(`atmosphereReadings.${idx}.reading3` as const, { valueAsNumber: true })} />
                      </div>
                      <input className="input" placeholder="Instrumento / N° serie" {...register(`atmosphereReadings.${idx}.instrument` as const)} />
                      <input className="input" placeholder="Responsable medición" {...register(`atmosphereReadings.${idx}.responsibleName` as const)} />
                      {danger && <p className="text-sm font-bold text-red-700">⚠ Valor fuera de rango seguro. NO INGRESAR, llamar a emergencias.</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">F. Nómina de trabajadores</h2>
            {errors.workers && typeof errors.workers.message === "string" && (
              <p className="text-sm text-red-600">{errors.workers.message}</p>
            )}
            {workersArray.fields.map((field, idx) => (
              <div key={field.id} className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Trabajador #{idx + 1}</p>
                  {workersArray.fields.length > 1 && (
                    <button type="button" onClick={() => workersArray.remove(idx)} className="text-red-600 text-sm">Eliminar</button>
                  )}
                </div>
                <input className="input" placeholder="Nombre completo" {...register(`workers.${idx}.fullName` as const)} />
                <input className="input" placeholder="RUT" {...register(`workers.${idx}.rut` as const)} />
                <input className="input" placeholder="Cargo" {...register(`workers.${idx}.position` as const)} />
                <input className="input" placeholder="Empresa" {...register(`workers.${idx}.company` as const)} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-5 w-5 accent-[#C41230]" {...register(`workers.${idx}.hasAltitudeMedicalCert` as const)} />
                  Certificado médico de altura
                </label>
                {watch(`workers.${idx}.hasAltitudeMedicalCert`) && (
                  <input type="date" className="input" {...register(`workers.${idx}.altitudeMedicalCertExpiry` as const)} />
                )}
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-5 w-5 accent-[#C41230]" {...register(`workers.${idx}.inductionCompleted` as const)} />
                  Inducción realizada
                </label>
                <Controller
                  control={control}
                  name={`workers.${idx}.signatureImage` as const}
                  render={({ field: sigField }) => (
                    <SignaturePad label="Firma del trabajador" initialValue={sigField.value} onSave={(dataUrl) => sigField.onChange(dataUrl)} />
                  )}
                />
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => workersArray.append({ fullName: "", rut: "", position: "", company: "", hasAltitudeMedicalCert: false, inductionCompleted: false })}>
              + Agregar trabajador
            </Button>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Revisión y envío</h2>
            <p className="text-sm text-gray-600">Revisa la información antes de crear el permiso. Quedará en estado &quot;Borrador&quot;.</p>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-1 text-sm">
              <p><b>Área:</b> {allValues.area}</p>
              <p><b>Fecha:</b> {allValues.date}</p>
              <p><b>Descripción:</b> {allValues.taskDescription}</p>
              <p><b>Tipos de permiso:</b> {allValues.permitTypes?.length || 0}</p>
              <p><b>Peligros:</b> {allValues.hazards?.length || 0}</p>
              <p><b>Medidas de control:</b> {allValues.controlMeasures?.length || 0}</p>
              <p><b>EPP:</b> {allValues.ppeRequired?.length || 0}</p>
              <p><b>Trabajadores:</b> {allValues.workers?.length || 0}</p>
            </div>
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {step > 0 && <Button type="button" variant="secondary" onClick={goBack}>Atrás</Button>}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>Siguiente</Button>
          ) : (
            <Button type="submit" disabled={submitting}>{submitting ? "Creando..." : "Crear permiso"}</Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
