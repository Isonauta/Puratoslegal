-- Donde nombre quedó como "wait" (placeholder sin resolver), usar el código como nombre
UPDATE "EvidenceTemplate"
SET nombre = "codigoSugerido"
WHERE nombre = 'wait' OR nombre = 'Wait' OR TRIM(nombre) = '';
