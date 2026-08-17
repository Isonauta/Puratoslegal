import type {
  PermitType,
  HazardType,
  ControlMeasure,
  PpeType,
  GasType,
  SignatureRole,
  AreaCondition,
  PotentialIncidentType,
  PermitStatus,
  Shift,
  UserRole,
} from "@/generated/prisma/client";

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  ALTURA_FISICA: "Altura Física >1,8m (DS23/2019)",
  TRABAJO_CALIENTE: "Trabajo en Caliente (DS1/2013)",
  ESPACIO_CONFINADO: "Espacio Confinado (NT MINSAL)",
  LOTO_BLOQUEO_ENERGIA: "LOTO – Bloqueo Energía (DS594)",
  EXCAVACION_ZANJAS: "Excavación/Zanjas (DS594)",
  TRABAJOS_ELECTRICOS: "Trabajos Eléctricos (NSEG5 E.n.71)",
  IZAJE_GRUA: "Izaje/Grúa (DS48/1984)",
  TRABAJOS_NOCTURNOS: "Trabajos Nocturnos (CT Art.36)",
  OTRO: "Otro",
};

export const HAZARD_LABELS: Record<HazardType, string> = {
  TRABAJO_ALTURA_FISICA: "Trabajo en altura física",
  CAIDA_MISMO_DISTINTO_NIVEL: "Caída mismo/distinto nivel",
  TRABAJO_CALIENTE: "Trabajo en caliente",
  ESPACIO_CONFINADO: "Espacio confinado",
  ENERGIA_PELIGROSA_LOTO: "Energía peligrosa (LOTO)",
  CONTACTO_ELECTRICIDAD: "Contacto con electricidad",
  EXPOSICION_RUIDO: "Exposición a ruido",
  EXPOSICION_RADIACION_UV: "Exposición a radiación UV",
  EXPOSICION_QUIMICOS: "Exposición a químicos",
  PROYECCION_PARTICULAS: "Proyección de partículas",
  CILINDROS_PRESION: "Cilindros con presión",
  ILUMINACION_DEFICIENTE: "Iluminación deficiente",
  SUPERFICIE_DEFECTUOSA: "Superficie defectuosa",
  TRASLADO_MATERIALES: "Traslado de materiales",
  SOBRESFUERZO_FISICO: "Sobresfuerzo físico",
  APRISIONAMIENTO: "Aprisionamiento",
  GOLPEADO_POR_CONTRA_OBJETO: "Golpeado por/contra objeto",
  INCENDIO_EXPLOSION: "Incendio/explosión",
  LIBERACION_GAS_ENERGIA: "Liberación gas/energía",
  HERR_ELECTRICAS_MANUALES: "Herr. eléct./manuales",
  POSICION_INCORRECTA: "Posición incorrecta",
  LINEAS_ENERGIZADAS_CERCANAS: "Líneas energizadas cercanas",
  DEFICIENCIA_O2: "Deficiencia de O2",
  OTRO: "Otro",
};

export const CONTROL_MEASURE_LABELS: Record<ControlMeasure, string> = {
  ATS_APLICADO_ANTES_INICIAR: "ATS aplicado antes de iniciar",
  DELIMITACION_SENALIZACION: "Delimitación/señalización",
  BLOQUEO_LOTO_EJECUTADO: "Bloqueo LOTO ejecutado",
  PERMISO_ESPACIO_CONFINADO: "Permiso espacio confinado",
  ARNES_DOS_COLAS_VIDA: "Arnés + 2 colas de vida",
  VIGIA_RESCATISTA_DESIGNADO: "Vigía/rescatista designado",
  EXTENSIONES_ELECTRICAS_OK: "Extensiones eléctricas ok",
  HERRAMIENTAS_INSPECCIONADAS: "Herramientas inspeccionadas",
  ILUMINACION_ADECUADA: "Iluminación adecuada",
  VENTILACION_ADECUADA: "Ventilación adecuada",
  COORD_CON_CLIENTE_REALIZADA: "Coord. con cliente realizada",
  PAUSAS_ROTACION_PERSONAL: "Pausas/rotación personal",
  CERT_MEDICO_ALTURA_VIGENTE: "Cert. médico altura vigente",
  CAPACITACION_TAREA_ESPECIFICA: "Capacit. tarea específica",
  HOJAS_SEGURIDAD_DISPONIBLES: "Hojas seguridad disponibles",
  ORDEN_ASEO_AREA: "Orden y aseo del área",
  LEVANTE_25KG_INDIVIDUAL: "Levante ≤25kg individual",
  TRABAJO_CON_AYUDANTE: "Trabajo con ayudante",
  DETENER_ANTE_PELIGRO: "Detener ante peligro",
  TRANSITO_VIAS_EXPEDITAS: "Tránsito vías expeditas",
  PLAN_EMERGENCIA_CONOCIDO: "Plan emergencia conocido",
  PROTEGER_AREAS_DERRAMES: "Proteger áreas en derrames",
  INSPECCIONAR_HERR_EQUIPOS: "Inspeccionar herr/equipos",
  OTRO: "Otro",
};

export const PPE_LABELS: Record<PpeType, string> = {
  CASCO_SEGURIDAD: "Casco de seguridad",
  ZAPATOS_BOTINES_SEGURIDAD: "Zapatos/botines seguridad",
  LENTES_SEGURIDAD: "Lentes de seguridad",
  PROTECCION_OCULAR_LATERAL_SUPERIOR: "Protec. ocular lateral/superior",
  CARETA_ROSTRO_COMPLETO: "Careta rostro completo",
  PROTECCION_AUDITIVA: "Protección auditiva",
  RESPIRADOR_POLVO_VAPORES: "Respirador polvo/vapores",
  GUANTES: "Guantes",
  ROPA_TRABAJO_OVEROL: "Ropa de trabajo/overol",
  ROPA_RETARDANTE_FUEGO: "Ropa retardante al fuego",
  ARNES_LINEA_VIDA: "Arnés + línea de vida",
  EQUIPO_ESPECIAL_SOLDADURA: "Equipo especial soldadura",
  CREMA_PROTECCION_UV: "Crema protección UV",
  CHALECO_REFLECTANTE: "Chaleco reflectante",
  OTRO: "Otro",
};

export const GAS_LABELS: Record<GasType, string> = {
  O2: "Oxígeno (O2)",
  CO: "Monóxido de carbono (CO)",
  H2S: "Sulfuro de hidrógeno (H2S)",
  LEL: "Gas inflamable (LEL)",
};

export const GAS_LIMITS: Record<GasType, { min?: number; max?: number; unit: string; description: string }> = {
  O2: { min: 19.5, max: 23.5, unit: "%", description: "Rango seguro 19,5% - 23,5%" },
  CO: { max: 25, unit: "ppm", description: "Límite < 25 ppm" },
  H2S: { max: 10, unit: "ppm", description: "Límite < 10 ppm" },
  LEL: { max: 10, unit: "%", description: "Límite < 10% LEL" },
};

export const SIGNATURE_ROLE_LABELS: Record<SignatureRole, string> = {
  SOLICITANTE: "Emite/Solicitante (Trabajador responsable)",
  SUPERVISOR_APRUEBA: "Aprueba (Supervisor/Jefe área)",
  SHE_AUTORIZA: "Autoriza (Experto Prevención/SHE)",
  SUPERVISOR_RECEPCIONA_CIERRE: "Recepciona cierre (Supervisor turno siguiente)",
  ATS_RESPONSABLE: "Responsable del análisis (ATS)",
  ATS_SUPERVISOR_VALIDA: "Supervisor que valida ATS",
  ATS_TRABAJADOR: "Trabajador (ATS)",
  PTS_TRABAJADOR: "Trabajador (PTS)",
};

export const AREA_CONDITION_LABELS: Record<AreaCondition, string> = {
  LIMPIA_Y_SEGURA: "Limpia y segura",
  CON_OBSERVACIONES: "Con observaciones",
};

export const POTENTIAL_INCIDENT_LABELS: Record<PotentialIncidentType, string> = {
  CAIDA_ALTURA: "Caída de altura",
  CAIDA_MISMO_NIVEL: "Caída mismo nivel",
  QUEMADURA: "Quemadura",
  ASFIXIA_INTOXICACION: "Asfixia/Intoxicación",
  ELECTROCUCION: "Electrocución",
  ATRAPAMIENTO: "Atrapamiento",
  GOLPE_OBJETO: "Golpe por objeto",
  CORTE_LACERACION: "Corte/Laceración",
  EXPLOSION_INCENDIO: "Explosión/Incendio",
  EXPOSICION_QUIMICA: "Exposición química",
  SOBRESFUERZO_LESION_MUSCULAR: "Sobresfuerzo/Lesión muscular",
  DERRUMBE_COLAPSO: "Derrumbe/Colapso",
  OTRO: "Otro",
};

export const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  BORRADOR: "Borrador",
  ENVIADO_A_APROBACION: "Enviado a aprobación",
  APROBADO_SUPERVISOR: "Aprobado por Supervisor",
  AUTORIZADO_SHE: "Autorizado por SHE",
  EN_CURSO: "En curso",
  CERRADO: "Cerrado",
  SUSPENDIDO: "Suspendido",
  ANULADO: "Anulado",
};

export const PERMIT_STATUS_COLORS: Record<PermitStatus, string> = {
  BORRADOR: "bg-gray-200 text-gray-800",
  ENVIADO_A_APROBACION: "bg-yellow-100 text-yellow-800",
  APROBADO_SUPERVISOR: "bg-blue-100 text-blue-800",
  AUTORIZADO_SHE: "bg-green-100 text-green-800",
  EN_CURSO: "bg-emerald-100 text-emerald-800",
  CERRADO: "bg-slate-300 text-slate-800",
  SUSPENDIDO: "bg-orange-100 text-orange-800",
  ANULADO: "bg-red-100 text-red-800",
};

export const SHIFT_LABELS: Record<Shift, string> = {
  DIA: "Día",
  TARDE: "Tarde",
  NOCHE: "Noche",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SOLICITANTE: "Solicitante",
  SUPERVISOR: "Supervisor",
  SHE: "SHE / Prevención de Riesgos",
  CONTRATISTA: "Contratista",
  ADMIN: "Administrador",
};
