-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Ambito" AS ENUM ('SST', 'MA', 'SGI', 'GENERAL');

-- CreateEnum
CREATE TYPE "CumpleEstado" AS ENUM ('SI', 'NO', 'NO_APLICA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "EvidenceFileStatus" AS ENUM ('POR_GENERAR', 'EN_REVISION', 'VIGENTE', 'VENCIDO', 'ACTUALIZAR');

-- CreateEnum
CREATE TYPE "ActionPlanStatus" AS ENUM ('ABIERTO', 'EN_CURSO', 'CERRADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('SHAREPOINT', 'GOOGLE_DRIVE');

-- CreateTable
CREATE TABLE "LegalRequirement" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipoRequisito" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "documentoNumero" TEXT,
    "titulo" TEXT NOT NULL,
    "anioPublicacion" INTEGER,
    "organismo" TEXT NOT NULL,
    "ambito" "Ambito" NOT NULL,
    "submateria" TEXT,
    "ultimaModificacion" TEXT,
    "articulo" TEXT,
    "requisitoTexto" TEXT,
    "cumple" "CumpleEstado" NOT NULL DEFAULT 'PENDIENTE',
    "formaCumplimiento" TEXT,
    "formato" TEXT,
    "herramientas" TEXT,
    "responsable" TEXT,
    "estado" TEXT,
    "riesgo" TEXT,
    "oportunidad" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceTemplate" (
    "id" TEXT NOT NULL,
    "codigoSugerido" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoEvidencia" TEXT NOT NULL,
    "normativa" TEXT,
    "ambito" "Ambito",
    "submateria" TEXT,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceLink" (
    "id" TEXT NOT NULL,
    "legalRequirementId" TEXT NOT NULL,
    "evidenceTemplateId" TEXT NOT NULL,

    CONSTRAINT "EvidenceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permit" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "organismoEmisor" TEXT NOT NULL,
    "baseLegal" TEXT,
    "instalacionAlcance" TEXT,
    "periodicidadVencimiento" TEXT,
    "consecuenciaIncumplimiento" TEXT,
    "estadoSugerido" TEXT,
    "proximoVencimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" TEXT NOT NULL,
    "status" "EvidenceFileStatus" NOT NULL DEFAULT 'POR_GENERAR',
    "provider" "StorageProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "webUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedBy" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "evidenceTemplateId" TEXT,
    "permitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL,
    "noConformidad" INTEGER,
    "legalRequirementId" TEXT,
    "tipoDocumento" TEXT,
    "documentoNumero" TEXT,
    "titulo" TEXT NOT NULL,
    "accionCorrectiva" TEXT NOT NULL,
    "responsable" TEXT,
    "fechaEjecucion" TIMESTAMP(3),
    "status" "ActionPlanStatus" NOT NULL DEFAULT 'ABIERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalRequirement_numero_key" ON "LegalRequirement"("numero");

-- CreateIndex
CREATE INDEX "LegalRequirement_ambito_idx" ON "LegalRequirement"("ambito");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceTemplate_codigoSugerido_key" ON "EvidenceTemplate"("codigoSugerido");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceLink_legalRequirementId_evidenceTemplateId_key" ON "EvidenceLink"("legalRequirementId", "evidenceTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "Permit_numero_key" ON "Permit"("numero");

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_legalRequirementId_fkey" FOREIGN KEY ("legalRequirementId") REFERENCES "LegalRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceLink" ADD CONSTRAINT "EvidenceLink_evidenceTemplateId_fkey" FOREIGN KEY ("evidenceTemplateId") REFERENCES "EvidenceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_evidenceTemplateId_fkey" FOREIGN KEY ("evidenceTemplateId") REFERENCES "EvidenceTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "Permit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_legalRequirementId_fkey" FOREIGN KEY ("legalRequirementId") REFERENCES "LegalRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

