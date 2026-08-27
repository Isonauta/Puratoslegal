"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { atsSchema, AtsInput } from "@/lib/pts/validations";
import {
  PERMIT_TYPE_LABELS,
  POTENTIAL_INCIDENT_LABELS,
  CONTROL_MEASURE_LABELS,
  PPE_LABELS,
} from "@/lib/pts/labels";
import CheckboxGroup from "@/components/pts/ui/CheckboxGroup";
import Button from "@/components/pts/ui/Button";
import SignaturePad from "@/components/pts/signature/SignaturePad";

type PermitData = {
  companyName: string;
  area: string;
  date: string;
  startTime: string;
  endTime: string;
  taskDescription: string;
  permitTypes: string[];
  controlMeasures: string[];
  ppeRequired: string[];
  workers: { fullName: string; rut: string }[];
};

export default function AtsForm({ permitId, permitData }: { permitId?: string; permitData?: PermitData }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, formState: { errors } } = useForm<AtsInput>({
    resolver: zodResolver(atsSchema),
    defaultValues: {
      workPermitId: permitId || null,
      companyName: permitData?.companyName ?? "",
      area: permitData?.area ?? "",
      date: permitData?.date ?? "",
      startTime: permitData?.startTime ?? "",
      endTime: permitData?.endTime ?? "",
      taskDescription: permitData?.taskDescription ?? "",
      highRiskProcedures: permitData?.permitTypes ?? [],
      potentialIncidents: [],
      controlMeasures: permitData?.controlMeasures ?? [],
      ppeRequired: permitData?.ppeRequired ?? [],
      steps: [{ taskStage: "", hazardsExposed: "", potentialIncidents: "", controls: "" }],
      workers: permitData?.workers?.length
        ? permitData.workers.map((w) => ({ fullName: w.fullName, rut: w.rut }))
        : [{ fullName: "", rut: "" }],
    },
  });

  const stepsArray = useFieldArray({ control, name: "steps" });
  const workersArray = useFieldArray({ control, name: "workers" });

  async function onSubmit(data: AtsInput) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/pts/ats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error al crear el ATS");
      }
      const created = await res.json();
      router.push(permitId ? `/pts/permits/${permitId}` : `/pts/ats/${created.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold">ATS – Análisis de Trabajo Seguro</h1>

      <div className="space-y-3">
        <Field label="Empresa" error={errors.companyName?.message}>
          <input className="input" {...register("companyName")} />
        </Field>
        <Field label="Lugar / Área" error={errors.area?.message}>
          <input className="input" {...register("area")} />
        </Field>
        <Field label="Fecha" error={errors.date?.message}>
          <input type="date" className="input" {...register("date")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora inicio" error={errors.startTime?.message}>
            <input type="time" className="input" {...register("startTime")} />
          </Field>
          <Field label="Hora término" error={errors.endTime?.message}>
            <input type="time" className="input" {...register("endTime")} />
          </Field>
        </div>
        <Field label="Descripción del trabajo" error={errors.taskDescription?.message}>
          <textarea className="input min-h-[80px]" {...register("taskDescription")} />
        </Field>
        <Field label="Supervisor que valida ATS (nombre)">
          <input className="input" {...register("supervisorValidatesName")} />
        </Field>
        <Field label="RUT supervisor que valida">
          <input className="input" {...register("supervisorValidatesRut")} />
        </Field>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Procedimientos especiales de alto riesgo</h2>
        <Controller control={control} name="highRiskProcedures" render={({ field }) => (
          <CheckboxGroup options={Object.entries(PERMIT_TYPE_LABELS).map(([value, label]) => ({ value, label }))} selected={field.value || []} onChange={field.onChange} columns={2} />
        )} />
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Identificación de incidentes potenciales</h2>
        <Controller control={control} name="potentialIncidents" render={({ field }) => (
          <CheckboxGroup options={Object.entries(POTENTIAL_INCIDENT_LABELS).map(([value, label]) => ({ value, label }))} selected={field.value || []} onChange={field.onChange} columns={2} />
        )} />
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Controles para evitar accidentes</h2>
        <Controller control={control} name="controlMeasures" render={({ field }) => (
          <CheckboxGroup options={Object.entries(CONTROL_MEASURE_LABELS).map(([value, label]) => ({ value, label }))} selected={field.value || []} onChange={field.onChange} columns={2} />
        )} />
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">EPP requerido</h2>
        <Controller control={control} name="ppeRequired" render={({ field }) => (
          <CheckboxGroup options={Object.entries(PPE_LABELS).map(([value, label]) => ({ value, label }))} selected={field.value || []} onChange={field.onChange} columns={2} />
        )} />
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Pasos del análisis</h2>
        {errors.steps && typeof errors.steps.message === "string" && <p className="text-sm text-red-600">{errors.steps.message}</p>}
        {stepsArray.fields.map((field, idx) => (
          <div key={field.id} className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
            <div className="flex justify-between">
              <p className="font-medium">Paso {idx + 1}</p>
              {stepsArray.fields.length > 1 && <button type="button" className="text-red-600 text-sm" onClick={() => stepsArray.remove(idx)}>Eliminar</button>}
            </div>
            <input className="input" placeholder="Etapa de la tarea" {...register(`steps.${idx}.taskStage` as const)} />
            <input className="input" placeholder="Peligros expuestos" {...register(`steps.${idx}.hazardsExposed` as const)} />
            <input className="input" placeholder="Incidentes potenciales" {...register(`steps.${idx}.potentialIncidents` as const)} />
            <input className="input" placeholder="Controles (jerarquía de control)" {...register(`steps.${idx}.controls` as const)} />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => stepsArray.append({ taskStage: "", hazardsExposed: "", potentialIncidents: "", controls: "" })}>
          + Agregar paso
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold">Trabajadores que firman (Ley 16.744 Art.21)</h2>
        {errors.workers && typeof errors.workers.message === "string" && <p className="text-sm text-red-600">{errors.workers.message}</p>}
        {workersArray.fields.map((field, idx) => (
          <div key={field.id} className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
            <div className="flex justify-between">
              <p className="font-medium">Trabajador #{idx + 1}</p>
              {workersArray.fields.length > 1 && <button type="button" className="text-red-600 text-sm" onClick={() => workersArray.remove(idx)}>Eliminar</button>}
            </div>
            <input className="input" placeholder="Nombre completo" {...register(`workers.${idx}.fullName` as const)} />
            <input className="input" placeholder="RUT" {...register(`workers.${idx}.rut` as const)} />
            <input type="date" className="input" placeholder="Vencimiento cert. médico" {...register(`workers.${idx}.medicalCertExpiry` as const)} />
            <Controller control={control} name={`workers.${idx}.signatureImage` as const} render={({ field: sigField }) => (
              <SignaturePad label="Firma" initialValue={sigField.value} onSave={(dataUrl) => sigField.onChange(dataUrl)} />
            )} />
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => workersArray.append({ fullName: "", rut: "" })}>
          + Agregar trabajador
        </Button>
      </div>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Guardar ATS"}</Button>
    </form>
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
