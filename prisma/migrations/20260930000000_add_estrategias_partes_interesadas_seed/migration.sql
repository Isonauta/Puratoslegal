-- AlterTable
ALTER TABLE "ParteInteresada" ADD COLUMN "estrategias" TEXT;

-- Carga real de "4.2 Partes Interesadas" (SIG-R-100), consolidando SST 2024 + MA 2025
-- por tipo de parte interesada. Poder/Impacto son una clasificación propuesta
-- (el Excel no trae esa columna) — ajustable desde la UI.
INSERT INTO "ParteInteresada"
  (id, nombre, poder, impacto, necesidades, expectativas, estrategias, "mecanismoSeguimiento", responsable, "createdAt", "updatedAt")
VALUES
  (
    'pi-colaboradores-2026',
    'Colaboradores',
    'Alto', 'Alto',
    'SST: Empleo seguro, remuneración adecuada, participación, seguridad y salud en el trabajo. | MA: Condiciones de trabajo con bajo impacto ambiental.',
    'SST: Bienestar social, estabilidad laboral, beneficios laborales, capacitación. | MA: Capacitación ambiental, cultura de sostenibilidad.',
    'SST: Acciones en conjunto con HR; calidad de vida. Implementación de un sistema de gestión en SST. | MA: Difundir indicadores ambientales. Programas de formación y sensibilización.',
    'SST: Cumplimiento plan de capacitaciones, entrega de beneficios, cumplimiento cronograma de actividades de SST. | MA: Cumplimiento plan de capacitaciones ambientales.',
    'Gerente General, Gerente de Operaciones, HR, Coord. Gestión Integral, Jefes de área',
    now(), now()
  ),
  (
    'pi-comunidad-2026',
    'Comunidad',
    'Alto', 'Alto',
    'SST: Generación de empleo, apoyo mutuo. | MA: No afectación por emisiones, residuos o vertimientos.',
    'SST: Buenas relaciones con la comunidad, buena aceptación de la Empresa en el entorno social. | MA: Buena relación, sin incidentes ambientales que afecten el entorno.',
    'SST: Acciones de responsabilidad social (Comité de sustentabilidad). | MA: Monitoreo de emisiones y vertimientos. Gestión de residuos.',
    'SST: Participación en actividades sociales para el beneficio de la comunidad, respuesta oportuna a quejas de la comunidad. | MA: Registros de monitoreo ambiental, respuesta a quejas.',
    'HR, Gerente Operaciones, Coord. Gestión Integral',
    now(), now()
  ),
  (
    'pi-clientes-2026',
    'Clientes',
    'Alto', 'Alto',
    'SST: Confiabilidad de que en los procesos se controla la salud y seguridad de los trabajadores según el SGSST. | MA: Productos con bajo impacto ambiental y embalajes ecológicos.',
    'SST: Certificación en Seguridad y Salud en el trabajo. | MA: Certificación ISO 14001, ecodiseño de envases.',
    'SST: Mantener la gestión de Seguridad y Salud (SGSST) en la organización. | MA: Mantener certificación, desarrollo de línea de ecodiseño.',
    'SST: Seguimiento mediante indicadores de efectividad de medidas tomadas. | MA: Seguimiento a solicitudes de clientes y auditorías externas.',
    'Gerente General, Gerente de Operaciones, Experto en prevención, Coord. Gestión Integral',
    now(), now()
  ),
  (
    'pi-accionistas-2026',
    'Accionistas',
    'Alto', 'Alto',
    'SST: Continuidad del negocio. | MA: Continuidad del negocio y rentabilidad.',
    'SST: Mantener certificación de Seguridad y Salud. | MA: Certificación ISO 14001 vigente, cumplimiento normativo ambiental.',
    'SST: Generar un mejor control de procesos para reducir el número de accidentes e incidentes, desarrollo de proyectos para mejorar la eficacia de las medidas preventivas aplicadas. | MA: Mantener el SGA y cumplir requisitos legales, desarrollo de proyectos de eficiencia ambiental.',
    'SST: Seguimiento mediante indicadores de SGSST, gestión de nuevas tecnologías para la disminución de incidentes y accidentes (días perdidos de trabajo). | MA: Seguimiento mediante indicadores ambientales, revisión gerencial anual.',
    'Gerente General, Gerente de Operaciones, Experto en prevención, Jefe de RR.HH., Coord. Gestión Integral',
    now(), now()
  ),
  (
    'pi-proveedores-2026',
    'Proveedores',
    'Bajo', 'Alto',
    'SST: Ambiente seguro de trabajo. | MA: Lineamientos claros de requisitos ambientales.',
    'SST: Lineamientos claros en temas de seguridad. | MA: Proveedores alineados con buenas prácticas ambientales.',
    'SST: Programa de Gestión de Proveedores, comunicación de requisitos a los proveedores, reglamento para empresas contratistas, informativos al ingresar a Puratos. | MA: Establecimiento de requisitos para proveedores, evaluación y re-evaluación.',
    'SST: Seguimiento al cumplimiento de los requisitos según el tipo de proveedor, seguimiento y re-evaluación de proveedores. | MA: Seguimiento al cumplimiento de requisitos ambientales por proveedor.',
    'Coord. Compras Supply Chain, Coord. Comercio Ext., Gerente de Operaciones, Calidad y Seguridad, Coord. Gestión Integral',
    now(), now()
  ),
  (
    'pi-entes-control-2026',
    'Entes de Control',
    'Alto', 'Alto',
    'SST: Implementación de regulaciones gubernamentales acorde a la normatividad legal chilena establecida, reporte oportuno de información sobre el SGSST. Acceso a información para verificación de cumplimiento en certificaciones y recertificaciones. | MA: Cumplimiento de normativas ambientales vigentes.',
    'SST: Cumplimiento de las regulaciones y requisitos de Seguridad y Salud en el trabajo. Cumplimiento normativo de ISO 45001. | MA: Reporte oportuno, cumplimiento de la normativa.',
    'SST: Identificación de los requisitos legales aplicables, implementación de planes de acción para el cumplimiento de los requisitos legales de Seguridad y Salud en el trabajo. Manejo del Sistema de Gestión de Seguridad según los objetivos identificados. | MA: Matriz de requisitos legales, revisión con abogado externo, software de seguimiento.',
    'SST: Evaluación del cumplimiento de los requisitos legales y reglamentarios aplicables a la Organización. Auditoría Interna. | MA: Evaluación del cumplimiento de requisitos legales, auditorías.',
    'Gerente General, HR, Experto en Prevención, Gerencia Operaciones, Coord. Gestión Integral',
    now(), now()
  );
