"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface PestelRow {
  categoria: string; subFactor: string | null; descripcion: string; sistema: string;
  clasificacion: string; texto: string; impactoTexto: string | null; tipoImpacto: string | null; relevancia: string | null;
}
interface FodaRow {
  sistema: string; ambito: string; cuestion: string; cuadrante: string; descripcion: string; tipoImpacto: string | null;
}

// Lee celdas por dirección real (columna+fila), no por índice de array — robusto
// aunque la columna A esté vacía en toda la hoja (xlsx compacta el rango usado).
function colCell(ws: XLSX.WorkSheet, r: number, col: string): string {
  const addr = `${col}${r}`;
  const v = ws[addr]?.v;
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function sheetRowRange(ws: XLSX.WorkSheet): { first: number; last: number } {
  const ref = ws["!ref"];
  if (!ref) return { first: 1, last: 1 };
  const range = XLSX.utils.decode_range(ref);
  return { first: range.s.r + 1, last: range.e.r + 1 };
}

function parsePestel(ws: XLSX.WorkSheet): PestelRow[] {
  const { first, last } = sheetRowRange(ws);
  const out: PestelRow[] = [];
  for (let r = first; r <= last; r++) {
    const categoria = colCell(ws, r, "B");
    const subFactor = colCell(ws, r, "C");
    const descripcion = colCell(ws, r, "D");
    if (!categoria || categoria === "FACTOR" || subFactor === "SUB-FACTOR" || descripcion.length < 5) continue;

    const impactoSST = colCell(ws, r, "E");
    const oportunidadSST = colCell(ws, r, "F");
    const amenazaSST = colCell(ws, r, "G");
    const impactoMA = colCell(ws, r, "H");
    const oportunidadMA = colCell(ws, r, "I");
    const amenazaMA = colCell(ws, r, "J");
    const tipoImpacto = colCell(ws, r, "K") || null;
    const relevancia = colCell(ws, r, "L") || null;

    const base = { categoria, subFactor: subFactor || null, descripcion, tipoImpacto, relevancia };
    if (oportunidadSST) out.push({ ...base, sistema: "SST", clasificacion: "Oportunidad", texto: oportunidadSST, impactoTexto: impactoSST || null });
    if (amenazaSST) out.push({ ...base, sistema: "SST", clasificacion: "Amenaza", texto: amenazaSST, impactoTexto: impactoSST || null });
    if (oportunidadMA) out.push({ ...base, sistema: "MA", clasificacion: "Oportunidad", texto: oportunidadMA, impactoTexto: impactoMA || null });
    if (amenazaMA) out.push({ ...base, sistema: "MA", clasificacion: "Amenaza", texto: amenazaMA, impactoTexto: impactoMA || null });
  }
  return out;
}

function parseFoda(ws: XLSX.WorkSheet): FodaRow[] {
  const { first, last } = sheetRowRange(ws);
  const out: FodaRow[] = [];
  for (let r = first; r <= last; r++) {
    const sistemaTexto = colCell(ws, r, "B");
    const ambito = colCell(ws, r, "C");
    const cuestion = colCell(ws, r, "D");
    if (ambito !== "EXTERNAS" && ambito !== "INTERNAS") continue;
    if (!cuestion) continue;

    const sistema = sistemaTexto.includes("14001") ? "MA" : "SST";
    const fortaleza = colCell(ws, r, "E");
    const oportunidad = colCell(ws, r, "F");
    const debilidad = colCell(ws, r, "G");
    const amenaza = colCell(ws, r, "H");
    const tipoImpacto = colCell(ws, r, "I") || null;

    const base = { sistema, ambito, cuestion, tipoImpacto };
    if (fortaleza) out.push({ ...base, cuadrante: "Fortaleza", descripcion: fortaleza });
    if (oportunidad) out.push({ ...base, cuadrante: "Oportunidad", descripcion: oportunidad });
    if (debilidad) out.push({ ...base, cuadrante: "Debilidad", descripcion: debilidad });
    if (amenaza) out.push({ ...base, cuadrante: "Amenaza", descripcion: amenaza });
  }
  return out;
}

export default function ImportarContextoModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [pestelRows, setPestelRows] = useState<PestelRow[] | null>(null);
  const [fodaRows, setFodaRows] = useState<FodaRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const pestelSheet = wb.Sheets["PESTEL Integrado"];
      const fodaSheet = wb.Sheets["Análisis FODA"];
      if (!pestelSheet && !fodaSheet) {
        setError("El archivo no tiene hojas 'PESTEL Integrado' ni 'Análisis FODA'. Verifica que sea la planilla SIG-R-100.");
        return;
      }
      setPestelRows(pestelSheet ? parsePestel(pestelSheet) : []);
      setFodaRows(fodaSheet ? parseFoda(fodaSheet) : []);
    } catch {
      setError("No se pudo leer el archivo. Verifica que sea un .xlsx válido.");
    }
  }

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      if (pestelRows && pestelRows.length > 0) {
        const res = await fetch("/api/pestel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: pestelRows }),
        });
        if (!res.ok) throw new Error("Falló la importación de PESTEL");
      }
      if (fodaRows && fodaRows.length > 0) {
        const res = await fetch("/api/foda", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bulk: fodaRows }),
        });
        if (!res.ok) throw new Error("Falló la importación de FODA");
      }
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  }

  const hasData = (pestelRows && pestelRows.length > 0) || (fodaRows && fodaRows.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">Importar Contexto (PESTEL + FODA)</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-zinc-500">
            Sube el archivo SIG-R-100 de Contexto Integrado (hojas &quot;PESTEL Integrado&quot; y &quot;Análisis FODA&quot;).
            Se agregan como registros nuevos — no reemplaza lo ya cargado.
          </p>
          <input type="file" accept=".xlsx" onChange={handleFile} className="text-sm w-full" />
          {fileName && !error && (
            <div className="bg-zinc-50 rounded-lg px-4 py-3 text-sm text-zinc-700 space-y-1">
              <p>Archivo: <strong>{fileName}</strong></p>
              <p>Factores PESTEL detectados: <strong>{pestelRows?.length ?? 0}</strong></p>
              <p>Ítems FODA detectados: <strong>{fodaRows?.length ?? 0}</strong></p>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancelar</button>
            <button onClick={handleImport} disabled={!hasData || importing}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
              {importing ? "Importando…" : "Importar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
