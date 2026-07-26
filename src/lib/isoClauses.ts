// Puntos normativos comunes a ISO 14001:2015 y ISO 45001:2018 (estructura
// de alto nivel / Anexo SL). Los marcados "(solo ISO 45001)" no existen
// como cláusula propia en 14001, pero se dejan en la misma lista para
// simplificar el selector.
export const ISO_CLAUSULAS = [
  { codigo: "4.1", nombre: "Comprensión de la organización y su contexto" },
  { codigo: "4.2", nombre: "Comprensión de las necesidades y expectativas de las partes interesadas" },
  { codigo: "4.3", nombre: "Determinación del alcance del sistema de gestión" },
  { codigo: "4.4", nombre: "Sistema de gestión y sus procesos" },
  { codigo: "5.1", nombre: "Liderazgo y compromiso" },
  { codigo: "5.2", nombre: "Política" },
  { codigo: "5.3", nombre: "Roles, responsabilidades y autoridades" },
  { codigo: "5.4", nombre: "Consulta y participación de los trabajadores (solo ISO 45001)" },
  { codigo: "6.1", nombre: "Acciones para abordar riesgos y oportunidades" },
  { codigo: "6.2", nombre: "Objetivos y planificación para lograrlos" },
  { codigo: "6.3", nombre: "Planificación de cambios (solo ISO 45001)" },
  { codigo: "7.1", nombre: "Recursos" },
  { codigo: "7.2", nombre: "Competencia" },
  { codigo: "7.3", nombre: "Toma de conciencia" },
  { codigo: "7.4", nombre: "Comunicación" },
  { codigo: "7.5", nombre: "Información documentada" },
  { codigo: "8.1", nombre: "Planificación y control operacional" },
  { codigo: "8.2", nombre: "Preparación y respuesta ante emergencias" },
  { codigo: "9.1", nombre: "Seguimiento, medición, análisis y evaluación" },
  { codigo: "9.2", nombre: "Auditoría interna" },
  { codigo: "9.3", nombre: "Revisión por la dirección" },
  { codigo: "10.1", nombre: "Generalidades" },
  { codigo: "10.2", nombre: "No conformidad y acción correctiva" },
  { codigo: "10.3", nombre: "Mejora continua" },
] as const;

export type IsoClausula = (typeof ISO_CLAUSULAS)[number]["codigo"];

export function nombreDeClausula(codigo: string): string {
  return ISO_CLAUSULAS.find((c) => c.codigo === codigo)?.nombre ?? "";
}

export const TIPOS_DOCUMENTO = ["Procedimiento", "Matriz", "Registro", "Instructivo", "Otro"] as const;

export const NORMA_LABEL: Record<string, string> = {
  ISO14001: "ISO 14001",
  ISO45001: "ISO 45001",
  AMBAS: "ISO 14001 + 45001",
};
