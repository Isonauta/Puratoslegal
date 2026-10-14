-- Estrategias CAME (FO/FA/DO/DA) — paso estratégico entre FODA y la
-- Matriz de Riesgos y Oportunidades (cláusula 6.1 ISO 9001).
CREATE TABLE IF NOT EXISTS "CameEstrategia" (
  "id"          TEXT NOT NULL,
  "numero"      SERIAL NOT NULL,
  "sistema"     TEXT NOT NULL DEFAULT 'SST',
  "tipo"        TEXT NOT NULL,
  "titulo"      TEXT NOT NULL,
  "descripcion" TEXT NOT NULL,
  "itemsFoda"   TEXT,
  "responsable" TEXT,
  "prioridad"   TEXT NOT NULL DEFAULT 'Media',
  "createdBy"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CameEstrategia_pkey" PRIMARY KEY ("id")
);
