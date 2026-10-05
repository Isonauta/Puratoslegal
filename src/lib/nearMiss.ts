// Módulo "Near Miss" (casi-accidente): reporte público vía QR + triage interno.
// El triage queda restringido a este grupo puntual de encargados SIG — el
// resto de usuarios autenticados no ve esta información (pedido explícito).
export const NEAR_MISS_REVIEWERS = [
  "scorroteaortiz@puratos.com", // Sebastián Corrotea
  "bhenriquez@puratos.com",     // Benjamín Henriquez
  "cneumannlatorre@puratos.com",// Carlos Neumann
];

export function isNearMissReviewer(email?: string | null): boolean {
  if (!email) return false;
  return NEAR_MISS_REVIEWERS.includes(email.toLowerCase());
}

export const NEAR_MISS_AREAS = [
  "Producción - Polvo",
  "Producción - Chocolate",
  "Producción - Wet",
  "Producción - Envasadoras",
  "Producción - Molino",
  "Producción",
  "Control de Calidad - Aplicación",
  "Control de Calidad - FQ",
  "Innovation Center",
  "Desarrollo",
  "Bodega Materia Prima",
  "Bodega Producto Terminado",
  "Seguridad",
  "Administración y RRHH",
  "Personal externo (casino, guardias, aseo)",
];

export const NEAR_MISS_CONSECUENCIAS = [
  "Riesgo Potencial Personal y Daño de Infraestructura",
  "Riesgo Potencial Personal y Sin Daño de Infraestructura",
];

export const NEAR_MISS_PRIORIDADES = ["Alta", "Media", "Baja"];

export const NEAR_MISS_DESCRIPCION_MAX = 100;
