-- CreateTable
CREATE TABLE IF NOT EXISTS "NearMiss" (
  "id"               TEXT NOT NULL,
  "numero"           SERIAL NOT NULL,
  "fecha"            TIMESTAMP(3) NOT NULL,
  "nombreReporta"    TEXT NOT NULL,
  "areaReporta"      TEXT NOT NULL,
  "titulo"           TEXT NOT NULL,
  "descripcion"      TEXT NOT NULL,
  "consecuencia"     TEXT NOT NULL,
  "medidaInmediata"  BOOLEAN NOT NULL,
  "estado"           TEXT NOT NULL DEFAULT 'Pendiente',
  "prioridad"        TEXT,
  "triagePor"        TEXT,
  "triageComentario" TEXT,
  "triageFecha"      TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NearMiss_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NearMiss_estado_idx" ON "NearMiss"("estado");
