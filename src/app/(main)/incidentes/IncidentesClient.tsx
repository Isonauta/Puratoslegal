"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

interface Siniestro {
  idSiniestro: string;
  nombreUsuario: string;
  rutUsuario: string;
  tipoSiniestro: string;
  calificacion: string;
  conTiempoPerdido: boolean;
  reposoActivo: boolean;
  diasReposo: number;
  diasPerdidosImputables: number;
  fechaAccidente: string | null;
  fechaInicioSintomas: string | null;
  fechaPresentacion: string | null;
  fechaInicioReposo: string | null;
  fechaAlta: string | null;
  fechaProximaCitacion: string | null;
  centroAsistencial: string | null;
  parteDelCuerpo: string | null;
  mecanismoAccidente: string | null;
}

interface Props {
  initialItems: Siniestro[];
  isAdmin: boolean;
}

function parseFecha(val: string | null | undefined): string | null {
  if (!val || val === "---" || val.trim() === "") return null;
  const parts = val.trim().split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00.000Z`;
  }
  return null;
}

function fmtFecha(val: string | null | undefined) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("es-CL");
  } catch {
    return "—";
  }
}

const TIPO_COLORS: Record<string, string> = {
  Trabajo: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Trayecto: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Enfermedad Profesional": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const CALIFICACION_COLORS: Record<string, string> = {
  "Con cobertura": "text-green-700 dark:text-green-400",
  "Con cobertura parcial": "text-amber-600 dark:text-amber-400",
  "Sin cobertura": "text-zinc-400",
};

export default function IncidentesClient({ initialItems, isAdmin }: Props) {
  const [items, setItems] = useState<Siniestro[]>(initialItems);
  const [filTipo, setFilTipo] = useState("Todos");
  const [filAnio, setFilAnio] = useState("Todos");
  const [selected, setSelected] = useState<Siniestro | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const anios = Array.from(
    new Set(
      items
        .map((i) => {
          const d = i.fechaAccidente ?? i.fechaInicioSintomas;
          return d ? new Date(d).getFullYear().toString() : null;
        })
        .filter(Boolean) as string[]
    )
  ).sort((a, b) => parseInt(b) - parseInt(a));

  const filtered = items.filter((i) => {
    if (filTipo !== "Todos" && i.tipoSiniestro !== filTipo) return false;
    if (filAnio !== "Todos") {
      const d = i.fechaAccidente ?? i.fechaInicioSintomas;
      if (!d || new Date(d).getFullYear().toString() !== filAnio) return false;
    }
    return true;
  });

  const totalDias = filtered.reduce((s, i) => s + i.diasPerdidosImputables, 0);
  const conTP = filtered.filter((i) => i.conTiempoPerdido).length;
  const sinTP = filtered.filter((i) => !i.conTiempoPerdido).length;
  const enfermedades = filtered.filter((i) => i.tipoSiniestro === "Enfermedad Profesional").length;

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("");

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      const records = rows
        .filter((r) => r["ID del siniestro"])
        .map((r) => ({
          idSiniestro: String(r["ID del siniestro"]),
          nombreUsuario: String(r["Nombre de usuario"] ?? ""),
          rutUsuario: String(r["Rut usuario"] ?? ""),
          tipoSiniestro: String(r["Tipo de siniestro"] ?? "Trabajo"),
          calificacion: String(r["Calificación"] ?? "Sin cobertura"),
          conTiempoPerdido: String(r["Con o sin tiempo perdido"]) === "CTP",
          reposoActivo: String(r["Reposo activo"]).toLowerCase() === "sí" || String(r["Reposo activo"]).toLowerCase() === "si",
          diasReposo: Number(r["Días de reposo"] ?? 0),
          diasPerdidosImputables: Number(r["Días perdidos imputables"] ?? 0),
          fechaAccidente: parseFecha(String(r["Fecha del accidente"] ?? "")),
          fechaInicioSintomas: parseFecha(String(r["Fecha de inicio de síntomas"] ?? "")),
          fechaPresentacion: parseFecha(String(r["Fecha de presentación"] ?? "")),
          fechaInicioReposo: parseFecha(String(r["Fecha de inicio del reposo"] ?? "")),
          fechaAlta: parseFecha(String(r["Fecha de alta"] ?? "")),
          fechaProximaCitacion: parseFecha(String(r["Fecha de próxima citación"] ?? "")),
          centroAsistencial: String(r["Centro asistencial de tratamiento"] ?? "") || null,
          parteDelCuerpo: String(r["Parte del cuerpo lesionada"] ?? "") || null,
          mecanismoAccidente: String(r["Mecanismo del accidente"] ?? "") || null,
        }));

      const res = await fetch("/api/siniestros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      });

      if (!res.ok) throw new Error("Error al importar");
      const { count } = await res.json();

      const updated = await fetch("/api/siniestros").then((r) => r.json());
      setItems(updated);
      setImportMsg(`✓ ${count} registros importados correctamente`);
    } catch (err) {
      setImportMsg("✗ Error al importar el archivo");
      console.error(err);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function exportarExcel() {
    const rows = filtered.map((i) => ({
      "ID Siniestro": i.idSiniestro,
      Nombre: i.nombreUsuario,
      RUT: i.rutUsuario,
      Tipo: i.tipoSiniestro,
      Calificación: i.calificacion,
      "CTP/STP": i.conTiempoPerdido ? "CTP" : "STP",
      "Días Reposo": i.diasReposo,
      "Días Perdidos Imputables": i.diasPerdidosImputables,
      "Fecha Accidente": fmtFecha(i.fechaAccidente),
      "Fecha Inicio Síntomas": fmtFecha(i.fechaInicioSintomas),
      "Fecha Presentación": fmtFecha(i.fechaPresentacion),
      "Fecha Inicio Reposo": fmtFecha(i.fechaInicioReposo),
      "Fecha Alta": fmtFecha(i.fechaAlta),
      "Próxima Citación": fmtFecha(i.fechaProximaCitacion),
      "Centro Asistencial": i.centroAsistencial ?? "",
      "Parte del Cuerpo": i.parteDelCuerpo ?? "",
      "Mecanismo Accidente": i.mecanismoAccidente ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Siniestros");
    XLSX.writeFile(wb, `Purasafe_Siniestros_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Siniestros</h1>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Registro individual de accidentes, trayectos y enfermedades profesionales
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportarExcel}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Excel
            </button>
            {isAdmin && (
              <>
                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#C41230] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#a00e27]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {importing ? "Importando…" : "Importar Excel"}
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={importing} />
                </label>
              </>
            )}
          </div>
        </div>
        {importMsg && (
          <p className={`mt-2 text-xs ${importMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{importMsg}</p>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
          {[
            { label: "Total siniestros", value: filtered.length, color: "text-zinc-900 dark:text-zinc-50" },
            { label: "Con tiempo perdido", value: conTP, color: "text-red-600 dark:text-red-400" },
            { label: "Sin tiempo perdido", value: sinTP, color: "text-green-600 dark:text-green-400" },
            { label: "Días perdidos imputables", value: totalDias, color: "text-amber-600 dark:text-amber-400" },
          ].map((k) => (
            <div key={k.label} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{k.label}</p>
              <p className={`mt-1 text-3xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex gap-1">
            {["Todos", "Trabajo", "Trayecto", "Enfermedad Profesional"].map((t) => (
              <button
                key={t}
                onClick={() => setFilTipo(t)}
                className={`rounded-lg px-3 py-1 text-xs font-medium ${
                  filTipo === t
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {["Todos", ...anios].map((a) => (
              <button
                key={a}
                onClick={() => setFilAnio(a)}
                className={`rounded-lg px-3 py-1 text-xs font-medium ${
                  filAnio === a
                    ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">RUT</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Calificación</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Días perdidos</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Fecha accidente</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Parte del cuerpo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Mecanismo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-400">
                    No hay siniestros registrados.{isAdmin && " Importa un archivo Excel para comenzar."}
                  </td>
                </tr>
              )}
              {filtered.map((i) => (
                <tr
                  key={i.idSiniestro}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  onClick={() => setSelected(i)}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                    {i.nombreUsuario}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{i.rutUsuario}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_COLORS[i.tipoSiniestro] ?? "bg-zinc-100 text-zinc-600"}`}>
                      {i.tipoSiniestro}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${CALIFICACION_COLORS[i.calificacion] ?? "text-zinc-500"} whitespace-nowrap`}>
                    {i.calificacion}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-50">
                    {i.diasPerdidosImputables > 0 ? (
                      <span className="text-red-600 dark:text-red-400">{i.diasPerdidosImputables}</span>
                    ) : (
                      <span className="text-zinc-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                    {fmtFecha(i.fechaAccidente ?? i.fechaInicioSintomas)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 max-w-[180px] truncate">
                    {i.parteDelCuerpo ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 max-w-[180px] truncate">
                    {i.mecanismoAccidente ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {enfermedades > 0 && (
          <p className="mt-3 text-xs text-purple-600 dark:text-purple-400">
            ⚠ {enfermedades} enfermedad{enfermedades > 1 ? "es" : ""} profesional incluida{enfermedades > 1 ? "s" : ""} — verifica cumplimiento cláusula 10.2 ISO 45001.
          </p>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{selected.nombreUsuario}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">ID: {selected.idSiniestro} · {selected.rutUsuario}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-1">
              {[
                ["Tipo de siniestro", selected.tipoSiniestro],
                ["Calificación", selected.calificacion],
                ["CTP / STP", selected.conTiempoPerdido ? "Con tiempo perdido (CTP)" : "Sin tiempo perdido (STP)"],
                ["Reposo activo", selected.reposoActivo ? "Sí" : "No"],
                ["Días de reposo", selected.diasReposo],
                ["Días perdidos imputables", selected.diasPerdidosImputables],
                ["Fecha del accidente", fmtFecha(selected.fechaAccidente)],
                ["Fecha inicio síntomas", fmtFecha(selected.fechaInicioSintomas)],
                ["Fecha presentación", fmtFecha(selected.fechaPresentacion)],
                ["Fecha inicio reposo", fmtFecha(selected.fechaInicioReposo)],
                ["Fecha de alta", fmtFecha(selected.fechaAlta)],
                ["Próxima citación", fmtFecha(selected.fechaProximaCitacion)],
                ["Centro asistencial", selected.centroAsistencial ?? "—"],
                ["Parte del cuerpo", selected.parteDelCuerpo ?? "—"],
                ["Mecanismo del accidente", selected.mecanismoAccidente ?? "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between gap-4 py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">{label}</span>
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-50 text-right">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
