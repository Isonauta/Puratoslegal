-- CreateTable
CREATE TABLE "LegalRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "tipoRequisito" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "documentoNumero" TEXT,
    "titulo" TEXT NOT NULL,
    "anioPublicacion" INTEGER,
    "organismo" TEXT NOT NULL,
    "ambito" TEXT NOT NULL,
    "submateria" TEXT,
    "ultimaModificacion" TEXT,
    "articulo" TEXT,
    "requisitoTexto" TEXT,
    "cumple" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "formaCumplimiento" TEXT,
    "formato" TEXT,
    "herramientas" TEXT,
    "responsable" TEXT,
    "estado" TEXT,
    "riesgo" TEXT,
    "oportunidad" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EvidenceTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoSugerido" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoEvidencia" TEXT NOT NULL,
    "normativa" TEXT,
    "ambito" TEXT,
    "submateria" TEXT,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EvidenceLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalRequirementId" TEXT NOT NULL,
    "evidenceTemplateId" TEXT NOT NULL,
    CONSTRAINT "EvidenceLink_legalRequirementId_fkey" FOREIGN KEY ("legalRequirementId") REFERENCES "LegalRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceLink_evidenceTemplateId_fkey" FOREIGN KEY ("evidenceTemplateId") REFERENCES "EvidenceTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Permit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "organismoEmisor" TEXT NOT NULL,
    "baseLegal" TEXT,
    "instalacionAlcance" TEXT,
    "periodicidadVencimiento" TEXT,
    "consecuenciaIncumplimiento" TEXT,
    "estadoSugerido" TEXT,
    "proximoVencimiento" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'POR_GENERAR',
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "webUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "uploadedBy" TEXT,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "evidenceTemplateId" TEXT,
    "permitId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EvidenceFile_evidenceTemplateId_fkey" FOREIGN KEY ("evidenceTemplateId") REFERENCES "EvidenceTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceFile_permitId_fkey" FOREIGN KEY ("permitId") REFERENCES "Permit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noConformidad" INTEGER,
    "legalRequirementId" TEXT NOT NULL,
    "accionCorrectiva" TEXT NOT NULL,
    "responsable" TEXT,
    "fechaEjecucion" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ABIERTO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionPlan_legalRequirementId_fkey" FOREIGN KEY ("legalRequirementId") REFERENCES "LegalRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
