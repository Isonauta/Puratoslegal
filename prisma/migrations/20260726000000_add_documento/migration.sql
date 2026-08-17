-- Gestor documental básico (subir/bajar documentos por punto normativo ISO 14001/45001)
-- Safe: additive only, no existing table modified

-- CreateEnum
CREATE TYPE "DocNorma" AS ENUM ('ISO14001', 'ISO45001', 'AMBAS');

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "clausula" TEXT NOT NULL,
    "clausulaNombre" TEXT NOT NULL,
    "norma" "DocNorma" NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "subidoPorEmail" TEXT,
    "subidoPorNombre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Documento_clausula_idx" ON "Documento"("clausula");

-- CreateIndex
CREATE INDEX "Documento_norma_idx" ON "Documento"("norma");
