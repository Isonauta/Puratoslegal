-- CreateTable
CREATE TABLE "PestelFactor" (
  "id"            TEXT NOT NULL,
  "categoria"     TEXT NOT NULL,
  "subFactor"     TEXT,
  "descripcion"   TEXT NOT NULL,
  "sistema"       TEXT NOT NULL,
  "clasificacion" TEXT NOT NULL,
  "texto"         TEXT NOT NULL,
  "impactoTexto"  TEXT,
  "tipoImpacto"   TEXT,
  "relevancia"    TEXT,
  "createdBy"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PestelFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FodaItem" (
  "id"             TEXT NOT NULL,
  "sistema"        TEXT NOT NULL,
  "ambito"         TEXT NOT NULL,
  "cuestion"       TEXT NOT NULL,
  "cuadrante"      TEXT NOT NULL,
  "descripcion"    TEXT NOT NULL,
  "tipoImpacto"    TEXT,
  "origenPestelId" TEXT,
  "createdBy"      TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FodaItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "RiesgoOportunidad" ADD COLUMN "origenFodaId" TEXT;

-- CreateIndex
CREATE INDEX "PestelFactor_sistema_idx" ON "PestelFactor"("sistema");
CREATE INDEX "PestelFactor_categoria_idx" ON "PestelFactor"("categoria");
CREATE INDEX "FodaItem_sistema_idx" ON "FodaItem"("sistema");
CREATE INDEX "FodaItem_origenPestelId_idx" ON "FodaItem"("origenPestelId");
CREATE INDEX "RiesgoOportunidad_origenFodaId_idx" ON "RiesgoOportunidad"("origenFodaId");

-- AddForeignKey
ALTER TABLE "FodaItem"
  ADD CONSTRAINT "FodaItem_origenPestelId_fkey"
  FOREIGN KEY ("origenPestelId") REFERENCES "PestelFactor"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiesgoOportunidad"
  ADD CONSTRAINT "RiesgoOportunidad_origenFodaId_fkey"
  FOREIGN KEY ("origenFodaId") REFERENCES "FodaItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
