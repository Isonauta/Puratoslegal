-- Add clasificacionSIG and fueraAlcanceSIG to LegalRequirement
-- Safe: additive only, no existing data modified
ALTER TABLE "LegalRequirement"
  ADD COLUMN IF NOT EXISTS "clasificacionSIG" TEXT,
  ADD COLUMN IF NOT EXISTS "fueraAlcanceSIG" BOOLEAN NOT NULL DEFAULT false;
