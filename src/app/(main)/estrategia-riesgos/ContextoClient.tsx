"use client";

import { useState } from "react";
import EstrategiaRiesgosClient from "./EstrategiaRiesgosClient";
import PestelTab, { type Pestel } from "./PestelTab";
import FodaTab, { type Foda } from "./FodaTab";
import ImportarContextoModal from "./ImportarContextoModal";

type RO = Parameters<typeof EstrategiaRiesgosClient>[0]["items"][number];

const TABS = ["PESTEL", "FODA", "Riesgos y Oportunidades"] as const;

export default function ContextoClient({ riesgos, pestel, foda, isAdmin }: {
  riesgos: RO[]; pestel: Pestel[]; foda: Foda[]; isAdmin: boolean;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("PESTEL");
  const [pestelItems, setPestelItems] = useState(pestel);
  const [fodaItems, setFodaItems] = useState(foda);
  const [showImportar, setShowImportar] = useState(false);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Contexto y Estrategia</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Análisis PESTEL, FODA y Matriz de Riesgos y Oportunidades del SIG — vinculados entre sí.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowImportar(true)}
            className="px-3 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 text-zinc-600 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            Importar desde Excel
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-zinc-100">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? "border-[#C41230] text-[#C41230]" : "border-transparent text-zinc-500 hover:text-zinc-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "PESTEL" && (
        <PestelTab items={pestelItems} isAdmin={isAdmin} onChanged={setPestelItems} />
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

      {tab === "Riesgos y Oportunidades" && (
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
