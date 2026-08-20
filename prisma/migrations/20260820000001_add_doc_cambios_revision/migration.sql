-- Add proximaRevision to Documento and descripcionCambios/sinCambios to DocRevision

ALTER TABLE "Documento"
  ADD COLUMN "proximaRevision" TIMESTAMP(3);

ALTER TABLE "DocRevision"
  ADD COLUMN "descripcionCambios" TEXT,
  ADD COLUMN "sinCambios"         BOOLEAN NOT NULL DEFAULT false;
