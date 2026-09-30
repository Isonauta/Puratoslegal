-- Carga real de "Objetivos Integrados" (SIG-R-100): 4 objetivos SST + 5 objetivos MA.
-- El documento traía PLAZO=2024 (SST) o plazos relativos como "2 años"/"1 año"/"Continuo"
-- (MA) — se homologan a anio=2026 (ciclo vigente) y el plazo original del documento
-- queda preservado en "comentario" para trazabilidad, junto con fórmula/recursos/proceso.
INSERT INTO "ObjetivoIndicador"
  (id, programa, objetivo, indicador, unidad, meta, "valorActual", frecuencia, responsable, anio, estado, comentario, "createdAt", "updatedAt")
VALUES
  (
    'oi-sst-accidentes-2026', 'SST',
    'Para asegurar que todos los procesos de manufactura incluidos dentro del alcance se realicen responsablemente, la alta dirección ha resumido sus objetivos y compromisos en su política de seguridad y salud en el trabajo. Un ambiente de trabajo seguro, sin riesgos para la salud, es fundamental para el éxito de nuestro negocio.',
    'Disminuir accidentes laborales',
    'LTIR', 0.83, 0, 'Mensual', 'Todos', 2026, 'En curso',
    'Fórmula: % cumplimiento = (N° de accidentes con ausentismo × 200.000) / Horas trabajadas. Meta cualitativa del documento original: disminuir N° de accidentes; referencia Group LTIR target 2024 = 0.83. Recursos: Humanos/Financieros/Técnicos. Proceso: Gestión Integral. Estrategia de cumplimiento: Plan de trabajo anual del SG-SST. Plazo original del documento: 2024 (actualizado a 2026).',
    now(), now()
  ),
  (
    'oi-sst-capacitacion-2026', 'SST',
    'Para asegurar que todos los procesos de manufactura incluidos dentro del alcance se realicen responsablemente, la alta dirección ha resumido sus objetivos y compromisos en su política de seguridad y salud en el trabajo. Un ambiente de trabajo seguro, sin riesgos para la salud, es fundamental para el éxito de nuestro negocio.',
    'Aumentar las actividades de aprendizaje y conocimiento',
    '%', 90, 0, 'Mensual', 'HSE, HHRR', 2026, 'En curso',
    'Fórmula: % cumplimiento = (N° actividades programadas / N° actividades realizadas) × 100. Meta: cumplir programa de capacitación al 90%. Recursos: Humanos/Financieros/Técnicos. Proceso: Gestión Integral. Plazo original del documento: 2024 (actualizado a 2026).',
    now(), now()
  ),
  (
    'oi-sst-nearmiss-2026', 'SST',
    'Para asegurar que todos los procesos de manufactura incluidos dentro del alcance se realicen responsablemente, la alta dirección ha resumido sus objetivos y compromisos en su política de seguridad y salud en el trabajo. Un ambiente de trabajo seguro, sin riesgos para la salud, es fundamental para el éxito de nuestro negocio.',
    'Cierre de near miss reportados',
    '%', 20, 0, 'Mensual', 'Mantención, HSE', 2026, 'En curso',
    'Fórmula: % cumplimiento = (N° near miss reportados / N° near miss solucionados) × 100. Meta del documento original: disminuir en 20% el N° de accidentes respecto al año anterior. Recursos: Humanos/Financieros/Técnicos. Proceso: Gestión Integral. Plazo original del documento: 2024 (actualizado a 2026).',
    now(), now()
  ),
  (
    'oi-sst-legal-2026', 'SST',
    'Para asegurar que todos los procesos de manufactura incluidos dentro del alcance se realicen responsablemente, la alta dirección ha resumido sus objetivos y compromisos en su política de seguridad y salud en el trabajo. Un ambiente de trabajo seguro, sin riesgos para la salud, es fundamental para el éxito de nuestro negocio.',
    'Nivel de cumplimiento requisitos legales de SST',
    '%', 100, 0, 'Mensual', 'Todos', 2026, 'En curso',
    'Fórmula: % Cumplimiento = (N° Requisitos legales cumplidos / Total de requisitos legales) × 100. Recursos: Humanos/Financieros/Técnicos. Proceso: Gestión Integral. Plazo original del documento: 2024 (actualizado a 2026).',
    now(), now()
  ),
  (
    'oi-ma-energia-2026', 'MA',
    'Mejorar la eficiencia energética',
    'Implementar tecnologías y prácticas que reduzcan el consumo de energía en un 15%.',
    '%', 15, 0, 'Mensual', NULL, 2026, 'En curso',
    'Fórmula: (Consumo de energía actual − Consumo después de implementación) / Consumo actual × 100. Recursos/estrategia: inversión en tecnologías energéticamente eficientes, capacitación del personal, auditorías energéticas. Proceso: Gestión Integral. Plazo original del documento: 2 años.',
    now(), now()
  ),
  (
    'oi-ma-ecodiseno-2026', 'MA',
    'Promover el ecodiseño',
    'Desarrollar y lanzar al mercado al menos tres nuevos productos con diseño ecológico.',
    'productos', 3, 0, 'Mensual', NULL, 2026, 'En curso',
    'Indicador de medición: número de nuevos productos ecológicos lanzados. Recursos: investigación y desarrollo, colaboración con diseñadores, marketing y promoción. Proceso: Gestión Integral. Plazo original del documento: 1 año.',
    now(), now()
  ),
  (
    'oi-ma-emisiones-2026', 'MA',
    'Reducir emisiones y gestionar residuos',
    'Implementar tecnologías que reduzcan las emisiones en un 10% y mejorar la gestión de residuos para reciclar al menos el 50%.',
    '%', 10, 0, 'Mensual', NULL, 2026, 'En curso',
    'Meta compuesta del documento original: reducir emisiones 10% Y reciclar al menos 50% de los residuos. Recursos: inversión en tecnologías de reducción de emisiones, sistemas de reciclaje, capacitación del personal. Proceso: Gestión Integral. Plazo original del documento: 1 año.',
    now(), now()
  ),
  (
    'oi-ma-legal-2026', 'MA',
    'Cumplimiento normativo',
    'Desarrollar una metodología de actualización continua de la matriz legal y realizar auditorías internas trimestrales.',
    'auditorías/año', 4, 0, 'Trimestral', NULL, 2026, 'En curso',
    'Indicador de medición: número de auditorías realizadas y cumplimiento de normativas. Recursos: recursos legales, software de gestión de normativas, personal capacitado. Proceso: Gestión Integral. Plazo original del documento: Continuo.',
    now(), now()
  ),
  (
    'oi-ma-cultura-2026', 'MA',
    'Capacitación y cultura ambiental',
    'Realizar programas de capacitación ambiental para todos los empleados, con un 95% de participación, y promover una cultura de sostenibilidad.',
    '%', 95, 0, 'Mensual', NULL, 2026, 'En curso',
    'Indicador de medición: N° empleados capacitados / N° total empleados × 100. Recursos: programas de capacitación, materiales educativos, tiempo dedicado a formación. Proceso: Gestión Integral. Plazo original del documento: 1 año.',
    now(), now()
  )
ON CONFLICT (id) DO NOTHING;
