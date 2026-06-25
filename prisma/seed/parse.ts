// Parses reference strings like "2, 35, 120-124" into the individual
// requirement numbers they point at: [2, 35, 120, 121, 122, 123, 124].
export function parseNumeroList(raw: string | null | undefined): number[] {
  if (!raw) return [];
  const numbers = new Set<number>();

  for (const part of String(raw).split(",")) {
    const token = part.trim();
    if (!token) continue;

    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      for (let n = Math.min(start, end); n <= Math.max(start, end); n++) {
        numbers.add(n);
      }
      continue;
    }

    const single = token.match(/^\d+$/);
    if (single) {
      numbers.add(Number(token));
    }
    // Non-numeric tokens (e.g. free text codes) are ignored: this field
    // only ever encodes Matriz Legal "N°" references.
  }

  return [...numbers].sort((a, b) => a - b);
}

// Extracts the evidence template codes referenced inside the Matriz Legal
// "Verificador de Cumplimiento" free-text cell, e.g.
// "R-SST-Contrat-01 | Registro de Control..." -> "R-SST-Contrat-01"
// Multiple codes can appear separated by newlines or semicolons.
export function parseEvidenceCodes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const codes = new Set<string>();
  const codePattern = /\b[A-Z]{1,4}-[A-Z0-9]{2,}-[A-Za-z0-9-]+\b/g;

  for (const line of String(raw).split(/[\n;]+/)) {
    const matches = line.match(codePattern);
    if (matches) matches.forEach((m) => codes.add(m.trim()));
  }

  return [...codes];
}

export function normalizeCumple(raw: string | null | undefined): "SI" | "NO" | "NO_APLICA" | "PENDIENTE" {
  const v = String(raw ?? "").trim().toUpperCase();
  if (v === "SI" || v === "SÍ") return "SI";
  if (v === "NO") return "NO";
  if (v === "N/A" || v === "NA") return "NO_APLICA";
  return "PENDIENTE";
}

export function normalizeAmbito(raw: string | null | undefined): "SST" | "MA" | "SGI" | "GENERAL" {
  const v = String(raw ?? "").trim().toUpperCase();
  if (v === "SST") return "SST";
  if (v === "MA") return "MA";
  if (v === "SGI") return "SGI";
  return "GENERAL";
}
