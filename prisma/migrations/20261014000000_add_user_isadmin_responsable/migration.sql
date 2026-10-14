-- Agrega isAdmin y responsable a User. Permite mover cuentas de
-- LEGACY_USERS (hardcodeadas en src/lib/auth.ts) a la tabla real,
-- para que ningún hash de contraseña vuelva a quedar en el código
-- fuente del repo.
--
-- isAdmin: admin del SIG general — independiente de `role`, que es
-- el permiso de PTS (SOLICITANTE/SUPERVISOR/SHE/CONTRATISTA/ADMIN).
-- responsable: nombre usado para filtrar "Mis tareas" por responsable
-- asignado (null para quienes no tienen tareas individuales, como
-- los admins).
--
-- No inserta datos — eso se hace aparte, fuera de git, directo en
-- Supabase SQL Editor (evita dejar hashes de contraseña en el
-- historial del repo).

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "responsable" TEXT;
