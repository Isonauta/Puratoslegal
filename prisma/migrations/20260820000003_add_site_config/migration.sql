CREATE TABLE "SiteConfig" (
  "key"       TEXT NOT NULL,
  "value"     TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("key")
);

-- Seed: fecha de inicio del contador (ajustar según el cliente)
INSERT INTO "SiteConfig" ("key", "value", "updatedAt")
VALUES ('lastAccidentDate', '2024-01-01', NOW())
ON CONFLICT ("key") DO NOTHING;
