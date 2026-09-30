-- CreateTable
CREATE TABLE "DeterminacionClimatica" (
  "id"                            TEXT NOT NULL,
  "fecha"                         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "esPertinente"                  BOOLEAN NOT NULL,
  "justificacion"                 TEXT NOT NULL,
  "expectativasPartesInteresadas" TEXT,
  "riesgosFisicos"                TEXT,
  "riesgosTransicion"             TEXT,
  "oportunidadesClimaticas"       TEXT,
  "responsable"                   TEXT,
  "createdBy"                     TEXT,
  "createdAt"                     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeterminacionClimatica_pkey" PRIMARY KEY ("id")
);
