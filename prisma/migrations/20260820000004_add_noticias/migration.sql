CREATE TABLE "Noticia" (
  "id"          TEXT NOT NULL,
  "titulo"      TEXT NOT NULL,
  "contenido"   TEXT NOT NULL,
  "categoria"   TEXT,
  "autorNombre" TEXT NOT NULL,
  "autorEmail"  TEXT NOT NULL,
  "publicado"   BOOLEAN NOT NULL DEFAULT true,
  "destacado"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);
