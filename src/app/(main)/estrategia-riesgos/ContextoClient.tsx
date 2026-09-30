"use client";

import { useMemo, useState } from "react";
import EstrategiaRiesgosClient from "./EstrategiaRiesgosClient";
import PestelTab, { type Pestel } from "./PestelTab";
import FodaTab, { type Foda } from "./FodaTab";
import ContextoTab, { type Contexto } from "./ContextoTab";
import PartesInteresadasTab, { type ParteInteresada } from "./PartesInteresadasTab";
import CambioClimaticoTab, { type Determinacion } from "./CambioClimaticoTab";
import ImportarContextoModal from "./ImportarContextoModal";

type RO = Parameters<typeof EstrategiaRiesgosClient>[0]["items"][number];

const TABS = ["Contexto", "Partes Interesadas", "Cambio Climático", "PESTEL", "FODA", "Matriz de riesgos"] as const;

export default function ContextoClient({ riesgos, pestel, foda, partesInteresadas, contexto: contextoInicial, climatica, isAdmin }: {
  riesgos: RO[]; pestel: Pestel[]; foda: Foda[]; partesInteresadas: ParteInteresada[]; contexto: Contexto; climatica: Determinacion[]; isAdmin: boolean;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Contexto");
  const [contexto, setContexto] = useState(contextoInicial);
  const [pestelItems, setPestelItems] = useState(pestel);
  const [fodaItems, setFodaItems] = useState(foda);
  const [partesItems, setPartesItems] = useState(partesInteresadas);
  const [climaticaItems, setClimaticaItems] = useState(climatica);
  const [showImportar, setShowImportar] = useState(false);

  const fodaOrigenIds = useMemo(
    () => new Set(fodaItems.filter((f) => f.origenPestelId).map((f) => f.origenPestelId as string)),
    [fodaItems]
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Contexto y Estrategia</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Contexto, Partes Interesadas, PESTEL, FODA y Matriz de Riesgos y Oportunidades del SIG — vinculados entre sí.</p>
        </div>
        {isAdmin && tab === "PESTEL" && (
          <button onClick={() => setShowImportar(true)}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Importar desde Excel
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-zinc-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t ? "border-[#C41230] text-[#C41230]" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Contexto" && (
        <ContextoTab contexto={contexto} isAdmin={isAdmin} onChanged={setContexto} />
      )}

      {tab === "Partes Interesadas" && (
        <PartesInteresadasTab items={partesItems} isAdmin={isAdmin} onChanged={setPartesItems} />
      )}

      {tab === "Cambio Climático" && (
        <CambioClimaticoTab items={climaticaItems} isAdmin={isAdmin} onChanged={setClimaticaItems} contexto={contexto} />
      )}

      {tab === "PESTEL" && (
        <PestelTab items={pestelItems} isAdmin={isAdmin} onChanged={setPestelItems} contexto={contexto} fodaOrigenIds={fodaOrigenIds} />
      )}

      {tab === "FODA" && (
        <FodaTab
          items={fodaItems}
          pestel={pestelItems}
          isAdmin={isAdmin}
          onChanged={setFodaItems}
          onRiesgoCreado={() => window.location.reload()}
        />
      )}

      {tab === "Matriz de riesgos" && (
        <EstrategiaRiesgosClient items={riesgos} isAdmin={isAdmin} />
      )}

      {showImportar && (
        <ImportarContextoModal
          onClose={() => setShowImportar(false)}
          onImported={() => window.location.reload()}
        />
      )}
    </div>
  );
}
