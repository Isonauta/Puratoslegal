-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanAccionIndicador" (
  "id"           TEXT NOT NULL,
  "indicadorId"  TEXT NOT NULL,
  "descripcion"  TEXT NOT NULL,
  "responsable"  TEXT,
  "recursos"     TEXT,
  "fechaLimite"  TIMESTAMP(3),
  "estado"       TEXT NOT NULL DEFAULT 'Pendiente',
  "fechaCierre"  TIMESTAMP(3),
  "createdBy"    TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlanAccionIndicador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanAccionIndicador_indicadorId_idx" ON "PlanAccionIndicador"("indicadorId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PlanAccionIndicador"
    ADD CONSTRAINT "PlanAccionIndicador_indicadorId_fkey"
    FOREIGN KEY ("indicadorId") REFERENCES "ObjetivoIndicador"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
