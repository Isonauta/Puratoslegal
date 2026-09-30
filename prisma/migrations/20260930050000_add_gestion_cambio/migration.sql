-- CreateTable
CREATE TABLE IF NOT EXISTS "GestionCambio" (
  "id"                          TEXT NOT NULL,
  "codigo"                      TEXT NOT NULL,
  "numero"                      INTEGER NOT NULL,
  "tipoCambio"                  TEXT,
  "naturalezaCambio"            TEXT,
  "categoria"                   TEXT,
  "area"                        TEXT,
  "descripcion"                 TEXT NOT NULL,
  "motivo"                      TEXT,
  "fechaSolicitud"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fechaImplementacionPrevista" TIMESTAMP(3),
  "solicitanteNombre"           TEXT,
  "esSignificativo"             BOOLEAN NOT NULL DEFAULT false,
  "impactoCalidad"              BOOLEAN NOT NULL DEFAULT false,
  "impactoSst"                  BOOLEAN NOT NULL DEFAULT false,
  "impactoAmbiental"            BOOLEAN NOT NULL DEFAULT false,
  "peligrosIdentificados"       TEXT,
  "riesgosEvaluados"            TEXT,
  "controlesPropuestos"         TEXT,
  "evaluadoPor"                 TEXT,
  "fechaEvaluacion"             TIMESTAMP(3),
  "autorizadoPor"               TEXT,
  "fechaAutorizacion"           TIMESTAMP(3),
  "comentarioAutorizacion"      TEXT,
  "requiereCapacitacion"        BOOLEAN NOT NULL DEFAULT false,
  "requiereProcedimientos"      BOOLEAN NOT NULL DEFAULT false,
  "requiereMatrizRiesgos"       BOOLEAN NOT NULL DEFAULT false,
  "detalleActualizacion"        TEXT,
  "responsableActualizacion"    TEXT,
  "fechaImplementacion"         TIMESTAMP(3),
  "seguimiento"                 TEXT,
  "responsableImplementacion"   TEXT,
  "eficaz"                      BOOLEAN,
  "validadoPor"                 TEXT,
  "fechaValidacion"             TIMESTAMP(3),
  "observacionesValidacion"     TEXT,
  "cicloRevision"               INTEGER NOT NULL DEFAULT 1,
  "estado"                      TEXT NOT NULL DEFAULT 'Solicitado',
  "createdBy"                   TEXT,
  "createdAt"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GestionCambio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CambioHistorial" (
  "id"             TEXT NOT NULL,
  "cambioId"       TEXT NOT NULL,
  "paso"           TEXT NOT NULL,
  "estadoAnterior" TEXT,
  "estadoNuevo"    TEXT,
  "comentario"     TEXT,
  "realizadoPor"   TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CambioHistorial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
DO $$ BEGIN
  CREATE UNIQUE INDEX "GestionCambio_codigo_key" ON "GestionCambio"("codigo");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "CambioHistorial_cambioId_idx" ON "CambioHistorial"("cambioId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "CambioHistorial"
    ADD CONSTRAINT "CambioHistorial_cambioId_fkey"
    FOREIGN KEY ("cambioId") REFERENCES "GestionCambio"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
