-- CreateTable
CREATE TABLE "ParteInteresada" (
  "id"                   TEXT NOT NULL,
  "nombre"               TEXT NOT NULL,
  "poder"                TEXT NOT NULL,
  "impacto"              TEXT NOT NULL,
  "necesidades"          TEXT,
  "expectativas"         TEXT,
  "mecanismoSeguimiento" TEXT,
  "responsable"          TEXT,
  "createdBy"            TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ParteInteresada_pkey" PRIMARY KEY ("id")
);
