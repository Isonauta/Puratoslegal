-- AddDocWorkflow: add status, workflow roles, and DocRevision model to Documento

CREATE TYPE "DocStatus" AS ENUM ('BORRADOR', 'EN_REVISION', 'EN_APROBACION', 'VIGENTE', 'RECHAZADO');

ALTER TABLE "Documento"
  ADD COLUMN "status"           "DocStatus" NOT NULL DEFAULT 'BORRADOR',
  ADD COLUMN "elaboradorEmail"  TEXT,
  ADD COLUMN "elaboradorNombre" TEXT,
  ADD COLUMN "revisorEmail"     TEXT,
  ADD COLUMN "revisorNombre"    TEXT,
  ADD COLUMN "aprobadorEmail"   TEXT,
  ADD COLUMN "aprobadorNombre"  TEXT,
  ADD COLUMN "contenido"        TEXT,
  ADD COLUMN "versionCode"      TEXT,
  ADD COLUMN "vigenciaDesde"    TIMESTAMP(3);

CREATE TABLE "DocRevision" (
  "id"           TEXT NOT NULL,
  "documentoId"  TEXT NOT NULL,
  "accion"       TEXT NOT NULL,
  "autorEmail"   TEXT NOT NULL,
  "autorNombre"  TEXT NOT NULL,
  "comentario"   TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DocRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Documento_status_idx" ON "Documento"("status");
CREATE INDEX "DocRevision_documentoId_idx" ON "DocRevision"("documentoId");

ALTER TABLE "DocRevision"
  ADD CONSTRAINT "DocRevision_documentoId_fkey"
  FOREIGN KEY ("documentoId") REFERENCES "Documento"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
