/*
  Warnings:

  - Added the required column `titulo` to the `ActionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noConformidad" INTEGER,
    "legalRequirementId" TEXT,
    "tipoDocumento" TEXT,
    "documentoNumero" TEXT,
    "titulo" TEXT NOT NULL,
    "accionCorrectiva" TEXT NOT NULL,
    "responsable" TEXT,
    "fechaEjecucion" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ABIERTO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionPlan_legalRequirementId_fkey" FOREIGN KEY ("legalRequirementId") REFERENCES "LegalRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ActionPlan" ("accionCorrectiva", "createdAt", "fechaEjecucion", "id", "legalRequirementId", "noConformidad", "responsable", "status", "updatedAt") SELECT "accionCorrectiva", "createdAt", "fechaEjecucion", "id", "legalRequirementId", "noConformidad", "responsable", "status", "updatedAt" FROM "ActionPlan";
DROP TABLE "ActionPlan";
ALTER TABLE "new_ActionPlan" RENAME TO "ActionPlan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
