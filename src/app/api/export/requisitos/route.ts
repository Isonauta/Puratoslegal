import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAllRequirements } from "@/lib/queries";
import type { RequirementFilters } from "@/lib/queries";
import type { Ambito, CumpleEstado } from "@/generated/prisma/enums";

const AMBITOS: Ambito[] = ["SST", "MA", "SGI", "GENERAL"];
const CUMPLE_VALUES: CumpleEstado[] = ["SI", "NO", "NO_APLICA", "PENDIENTE"];

const CUMPLE_LABEL: Record<string, string> = {
  SI: "Cumple",
  NO: "No cumple",
  NO_APLICA: "No aplica",
  PENDIENTE: "Pendiente",
};

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const ambitoParam = params.get("ambito") ?? undefined;
  const cumpleParam = params.get("cumple") ?? undefined;
  const evidenciaParam = params.get("evidencia") ?? undefined;

  const filters: RequirementFilters = {
    ambito: AMBITOS.includes(ambitoParam as Ambito) ? (ambitoParam as Ambito) : undefined,
    cumple: CUMPLE_VALUES.includes(cumpleParam as CumpleEstado) ? (cumpleParam as CumpleEstado) : undefined,
    evidencia: evidenciaParam === "con" || evidenciaParam === "sin" ? evidenciaParam : undefined,
    q: params.get("q") || undefined,
  };

  const requirements = await getAllRequirements(filters);

  const rows = requirements.map((r) => {
    const evidenceLinks = r.evidenceLinks.flatMap((link) =>
      link.evidenceTemplate.files.map((f) => f.webUrl)
    );
    return {
      "N°": r.numero,
      Ámbito: r.ambito,
      Título: r.titulo,
      Artículo: r.articulo ?? "",
      Organismo: r.organismo,
      Cumple: CUMPLE_LABEL[r.cumple] ?? r.cumple,
      Responsable: r.responsable ?? "",
      "Evidencia(s)": evidenceLinks.join(", "),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Requisitos");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="requisitos.xlsx"`,
    },
  });
}
