import { z } from "zod";

const permitTypeEnum = z.enum([
  "ALTURA_FISICA", "TRABAJO_CALIENTE", "ESPACIO_CONFINADO", "LOTO_BLOQUEO_ENERGIA",
  "EXCAVACION_ZANJAS", "TRABAJOS_ELECTRICOS", "IZAJE_GRUA", "TRABAJOS_NOCTURNOS", "OTRO",
]);
const hazardEnum = z.enum([
  "TRABAJO_ALTURA_FISICA", "CAIDA_MISMO_DISTINTO_NIVEL", "TRABAJO_CALIENTE", "ESPACIO_CONFINADO",
  "ENERGIA_PELIGROSA_LOTO", "CONTACTO_ELECTRICIDAD", "EXPOSICION_RUIDO", "EXPOSICION_RADIACION_UV",
  "EXPOSICION_QUIMICOS", "PROYECCION_PARTICULAS", "CILINDROS_PRESION", "ILUMINACION_DEFICIENTE",
  "SUPERFICIE_DEFECTUOSA", "TRASLADO_MATERIALES", "SOBRESFUERZO_FISICO", "APRISIONAMIENTO",
  "GOLPEADO_POR_CONTRA_OBJETO", "INCENDIO_EXPLOSION", "LIBERACION_GAS_ENERGIA",
  "HERR_ELECTRICAS_MANUALES", "POSICION_INCORRECTA", "LINEAS_ENERGIZADAS_CERCANAS",
  "DEFICIENCIA_O2", "OTRO",
]);
const controlMeasureEnum = z.enum([
  "ATS_APLICADO_ANTES_INICIAR", "DELIMITACION_SENALIZACION", "BLOQUEO_LOTO_EJECUTADO",
  "PERMISO_ESPACIO_CONFINADO", "ARNES_DOS_COLAS_VIDA", "VIGIA_RESCATISTA_DESIGNADO",
  "EXTENSIONES_ELECTRICAS_OK", "HERRAMIENTAS_INSPECCIONADAS", "ILUMINACION_ADECUADA",
  "VENTILACION_ADECUADA", "COORD_CON_CLIENTE_REALIZADA", "PAUSAS_ROTACION_PERSONAL",
  "CERT_MEDICO_ALTURA_VIGENTE", "CAPACITACION_TAREA_ESPECIFICA", "HOJAS_SEGURIDAD_DISPONIBLES",
  "ORDEN_ASEO_AREA", "LEVANTE_25KG_INDIVIDUAL", "TRABAJO_CON_AYUDANTE", "DETENER_ANTE_PELIGRO",
  "TRANSITO_VIAS_EXPEDITAS", "PLAN_EMERGENCIA_CONOCIDO", "PROTEGER_AREAS_DERRAMES",
  "INSPECCIONAR_HERR_EQUIPOS", "OTRO",
]);
const ppeEnum = z.enum([
  "CASCO_SEGURIDAD", "ZAPATOS_BOTINES_SEGURIDAD", "LENTES_SEGURIDAD",
  "PROTECCION_OCULAR_LATERAL_SUPERIOR", "CARETA_ROSTRO_COMPLETO", "PROTECCION_AUDITIVA",
  "RESPIRADOR_POLVO_VAPORES", "GUANTES", "ROPA_TRABAJO_OVEROL", "ROPA_RETARDANTE_FUEGO",
  "ARNES_LINEA_VIDA", "EQUIPO_ESPECIAL_SOLDADURA", "CREMA_PROTECCION_UV",
  "CHALECO_REFLECTANTE", "OTRO",
]);
const shiftEnum = z.enum(["DIA", "TARDE", "NOCHE"]);
const gasEnum = z.enum(["O2", "CO", "H2S", "LEL"]);
const potentialIncidentEnum = z.enum([
  "CAIDA_ALTURA", "CAIDA_MISMO_NIVEL", "QUEMADURA", "ASFIXIA_INTOXICACION", "ELECTROCUCION",
  "ATRAPAMIENTO", "GOLPE_OBJETO", "CORTE_LACERACION", "EXPLOSION_INCENDIO", "EXPOSICION_QUIMICA",
  "SOBRESFUERZO_LESION_MUSCULAR", "DERRUMBE_COLAPSO", "OTRO",
]);

export const workerSchema = z.object({
  fullName: z.string().min(2, "Nombre requerido"),
  rut: z.string().min(3, "RUT requerido"),
  position: z.string().min(2, "Cargo requerido"),
  company: z.string().min(2, "Empresa requerida"),
  hasAltitudeMedicalCert: z.boolean().default(false),
  altitudeMedicalCertExpiry: z.string().optional().nullable(),
  inductionCompleted: z.boolean().default(false),
  signatureImage: z.string().optional().nullable(),
});

export const atmosphereReadingSchema = z.object({
  gas: gasEnum,
  reading1: z.number().optional().nullable(),
  reading2: z.number().optional().nullable(),
  reading3: z.number().optional().nullable(),
  instrument: z.string().optional().nullable(),
  responsibleName: z.string().optional().nullable(),
});

export const generalDataSchema = z.object({
  companyRut: z.string().min(3, "RUT de la empresa requerido"),
  date: z.string().min(1, "Fecha requerida"),
  area: z.string().min(2, "Área/lugar de trabajo requerido"),
  shift: shiftEnum,
  startTime: z.string().min(1, "Hora de inicio requerida"),
  endTime: z.string().min(1, "Hora de término requerida"),
  taskDescription: z.string().min(5, "Descripción de la tarea requerida"),
  supervisorId: z.string().optional().nullable(),
  contractorCompany: z.string().optional().nullable(),
  workerCount: z.number().int().min(0).default(0),
});

export const fullPermitSchema = generalDataSchema
  .merge(z.object({ permitTypes: z.array(permitTypeEnum).min(1, "Selecciona al menos un tipo de permiso"), permitTypeOtherText: z.string().optional().nullable() }))
  .merge(z.object({ hazards: z.array(hazardEnum).min(1, "Selecciona al menos un peligro identificado"), hazardOtherText: z.string().optional().nullable() }))
  .merge(z.object({ controlMeasures: z.array(controlMeasureEnum).min(1, "Selecciona al menos una medida de control"), controlMeasureOtherText: z.string().optional().nullable() }))
  .merge(z.object({ ppeRequired: z.array(ppeEnum).min(1, "Selecciona al menos un EPP"), ppeGlovesType: z.string().optional().nullable(), ppeOtherText: z.string().optional().nullable(), ppeObservations: z.string().optional().nullable() }))
  .merge(z.object({ atmosphereReadings: z.array(atmosphereReadingSchema).optional().default([]) }))
  .merge(z.object({ workers: z.array(workerSchema).min(1, "Agrega al menos un trabajador") }));

export type FullPermitInput = z.input<typeof fullPermitSchema>;
export type WorkerInput = z.infer<typeof workerSchema>;
export type AtmosphereReadingInput = z.infer<typeof atmosphereReadingSchema>;

export const atsStepSchema = z.object({
  taskStage: z.string().min(1, "Etapa requerida"),
  hazardsExposed: z.string().min(1, "Peligro requerido"),
  potentialIncidents: z.string().min(1, "Incidente potencial requerido"),
  controls: z.string().min(1, "Control requerido"),
});

export const atsWorkerSchema = z.object({
  fullName: z.string().min(2, "Nombre requerido"),
  rut: z.string().min(3, "RUT requerido"),
  medicalCertExpiry: z.string().optional().nullable(),
  signatureImage: z.string().optional().nullable(),
});

export const atsSchema = z.object({
  workPermitId: z.string().optional().nullable(),
  companyName: z.string().min(2, "Empresa requerida"),
  area: z.string().min(2, "Área/lugar requerido"),
  date: z.string().min(1, "Fecha requerida"),
  startTime: z.string().min(1, "Hora de inicio requerida"),
  endTime: z.string().min(1, "Hora de término requerida"),
  taskDescription: z.string().min(5, "Descripción de la tarea requerida"),
  supervisorValidatesName: z.string().optional().nullable(),
  supervisorValidatesRut: z.string().optional().nullable(),
  highRiskProcedures: z.array(permitTypeEnum).default([]),
  potentialIncidents: z.array(potentialIncidentEnum).default([]),
  potentialIncidentOther: z.string().optional().nullable(),
  controlMeasures: z.array(controlMeasureEnum).default([]),
  controlMeasureOther: z.string().optional().nullable(),
  ppeRequired: z.array(ppeEnum).default([]),
  ppeOtherText: z.string().optional().nullable(),
  steps: z.array(atsStepSchema).min(1, "Agrega al menos un paso"),
  workers: z.array(atsWorkerSchema).min(1, "Agrega al menos un trabajador"),
});

export type AtsInput = z.input<typeof atsSchema>;
