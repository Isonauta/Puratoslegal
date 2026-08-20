CREATE TABLE "Video" (
  "id"          TEXT NOT NULL,
  "titulo"      TEXT NOT NULL,
  "descripcion" TEXT,
  "youtubeUrl"  TEXT NOT NULL,
  "orden"       INTEGER NOT NULL DEFAULT 0,
  "publicado"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Termino" (
  "id"         TEXT NOT NULL,
  "termino"    TEXT NOT NULL,
  "definicion" TEXT NOT NULL,
  "orden"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Termino_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Politica" (
  "id"        TEXT NOT NULL,
  "titulo"    TEXT NOT NULL,
  "tipo"      TEXT NOT NULL,
  "contenido" TEXT,
  "pdfUrl"    TEXT,
  "publicado" BOOLEAN NOT NULL DEFAULT true,
  "orden"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Politica_pkey" PRIMARY KEY ("id")
);
