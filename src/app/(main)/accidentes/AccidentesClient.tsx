"use client";
import { useState, useMemo } from "react";

const AREAS = ["Chocolate","WET","UHT","Laboratorio Calidad","Laboratorio Desarrollo","Bodega CD","Administración","AXTEL","PTAR"] as const;
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const ANIO_ACTUAL = 2026;

type Stat = {
  id: string; anio: number; mes: number; area: string;
  trabajadores: number; horasTrabajadas: number;
  accidentesConTP: number; accidentesSinTP: number; diasPerdidos: number;
};

function calcIndicadores(s: Stat) {
  const totalAcc = s.accidentesConTP + s.accidentesSinTP;
  const IF_ = s.horasTrabajadas > 0 ? (s.accidentesConTP * 1_000_000) / s.horasTrabajadas : 0;
  const IG_ = s.horasTrabajadas > 0 ? (s.diasPerdidos * 1_000_000) / s.horasTrabajadas : 0;
  const IA_ = IF_ * IG_ / 1_000_000;
  return { totalAcc, IF: IF_, IG: IG_, IA: IA_ };
}

function fmt(n: number, dec = 2) { return n.toFixed(dec); }

function CargaModal({ onClose, onSaved, anioSel }: { onClose: () => void; onSaved: (s: Stat) => void; anioSel: number }) {
  const [anio, setAnio] = useState(anioSel);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [area, setArea] = useState<string>(AREAS[0]);
  const [trabajadores, setTrabajadores] = useState("");
  const [horas, setHoras] = useState("");
  const [conTP, setConTP] = useState("");
  const [sinTP, setSinTP] = useState("");
  const [dias, setDias] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const res = await fetch("/api/accidentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anio, mes, area,
        trabajadores: parseInt(trabajadores) || 0,
        horasTrabajadas: parseFloat(horas) || 0,
        accidentesConTP: parseInt(conTP) || 0,
        accidentesSinTP: parseInt(sinTP) || 0,
        diasPerdidos: parseInt(dias) || 0,
      }),
    });
    setSaving(false);
    if (res.ok) { onSaved(await res.json()); onClose(); }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar"); }
  }

  const inp = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Cargar datos mensuales DS 67</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Año</label>
              <select value={anio} onChange={e => setAnio(parseInt(e.target.value))} className={inp}>
                {[ANIO_ACTUAL-1, ANIO_ACTUAL, ANIO_ACTUAL+1].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mes</label>
              <select value={mes} onChange={e => setMes(parseInt(e.target.value))} className={inp}>
                {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Área</label>
              <select value={area} onChange={e => setArea(e.target.value)} className={inp}>
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos del mes</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">N° Trabajadores</label>
                <input type="number" min="0" value={trabajadores} onChange={e => setTrabajadores(e.target.value)} className={inp} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Horas trabajadas</label>
                <input type="number" min="0" step="0.5" value={horas} onChange={e => setHoras(e.target.value)} className={inp} placeholder="0" />
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Accidentes del trabajo</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Con tiempo perdido</label>
                <input type="number" min="0" value={conTP} onChange={e => setConTP(e.target.value)} className={inp} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sin tiempo perdido</label>
                <input type="number" min="0" value={sinTP} onChange={e => setSinTP(e.target.value)} className={inp} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Días perdidos</label>
                <input type="number" min="0" value={dias} onChange={e => setDias(e.target.value)} className={inp} placeholder="0" />
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IndicadorCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

function AreaCard({ area, stats }: { area: string; stats: Stat[] }) {
  const totales = stats.reduce((acc, s) => ({
    trabajadores: Math.max(acc.trabajadores, s.trabajadores),
    horasTrabajadas: acc.horasTrabajadas + s.horasTrabajadas,
    accidentesConTP: acc.accidentesConTP + s.accidentesConTP,
    accidentesSinTP: acc.accidentesSinTP + s.accidentesSinTP,
    diasPerdidos: acc.diasPerdidos + s.diasPerdidos,
  }), { trabajadores: 0, horasTrabajadas: 0, accidentesConTP: 0, accidentesSinTP: 0, diasPerdidos: 0 });

  const ind = calcIndicadores({ ...totales, id: "", anio: 0, mes: 0, area });
  const riesgo = ind.IA > 5 ? "alto" : ind.IA > 2 ? "medio" : "bajo";
  const riesgoColor = riesgo === "alto" ? "text-red-600 bg-red-50" : riesgo === "medio" ? "text-orange-500 bg-orange-50" : "text-emerald-600 bg-emerald-50";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm">{area}</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${riesgoColor}`}>
          {riesgo === "alto" ? "Riesgo alto" : riesgo === "medio" ? "Riesgo medio" : "Riesgo bajo"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <IndicadorCard label="IF" value={fmt(ind.IF)} sub="Índice de Frecuencia" color="bg-blue-50 text-blue-800" />
        <IndicadorCard label="IG" value={fmt(ind.IG)} sub="Índice de Gravedad" color="bg-purple-50 text-purple-800" />
        <IndicadorCard label="IA" value={fmt(ind.IA)} sub="Índice de Accidentabilidad" color="bg-orange-50 text-orange-800" />
        <IndicadorCard label="Días perdidos" value={String(totales.diasPerdidos)} sub={`${ind.totalAcc} accidente(s)`} color="bg-red-50 text-red-800" />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
        <div><span className="block text-base font-bold text-gray-800">{totales.accidentesConTP}</span>Con TP</div>
        <div><span className="block text-base font-bold text-gray-800">{totales.accidentesSinTP}</span>Sin TP</div>
        <div><span className="block text-base font-bold text-gray-800">{totales.trabajadores}</span>Trabajadores</div>
      </div>
    </div>
  );
}

export default function AccidentesClient({ stats: initialStats, isAdmin }: { stats: Stat[]; isAdmin: boolean }) {
  const [stats, setStats] = useState(initialStats);
  const [showModal, setShowModal] = useState(false);
  const [anioFiltro, setAnioFiltro] = useState(ANIO_ACTUAL);
  const [mesFiltro, setMesFiltro] = useState(0); // 0 = todos

  const filtered = useMemo(() =>
    stats.filter(s => s.anio === anioFiltro && (mesFiltro === 0 || s.mes === mesFiltro)),
    [stats, anioFiltro, mesFiltro]
  );

  const statsPorArea = useMemo(() =>
    AREAS.map(area => ({ area, stats: filtered.filter(s => s.area === area) })),
    [filtered]
  );

  // Totales empresa
  const totEmpresa = filtered.reduce((acc, s) => ({
    horasTrabajadas: acc.horasTrabajadas + s.horasTrabajadas,
    accidentesConTP: acc.accidentesConTP + s.accidentesConTP,
    accidentesSinTP: acc.accidentesSinTP + s.accidentesSinTP,
    diasPerdidos: acc.diasPerdidos + s.diasPerdidos,
    trabajadores: acc.trabajadores + s.trabajadores,
  }), { horasTrabajadas: 0, accidentesConTP: 0, accidentesSinTP: 0, diasPerdidos: 0, trabajadores: 0 });
  const indEmpresa = calcIndicadores({ ...totEmpresa, id:"", anio:0, mes:0, area:"" });

  function handleSaved(s: Stat) {
    setStats(prev => {
      const idx = prev.findIndex(p => p.anio === s.anio && p.mes === s.mes && p.area === s.area);
      if (idx >= 0) { const n = [...prev]; n[idx] = s; return n; }
      return [s, ...prev];
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accidentabilidad DS 67</h1>
          <p className="text-sm text-gray-500 mt-0.5">Indicadores mensuales por área — Ley 16.744</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-lg">
            <span className="text-base leading-none">+</span> Cargar datos
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={anioFiltro} onChange={e => setAnioFiltro(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          {[ANIO_ACTUAL-1, ANIO_ACTUAL, ANIO_ACTUAL+1].map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={mesFiltro} onChange={e => setMesFiltro(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value={0}>Todos los meses (acumulado)</option>
          {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
      </div>

      {/* Resumen empresa */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 mb-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Resumen empresa</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-3xl font-bold">{fmt(indEmpresa.IF)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Índice de Frecuencia</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{fmt(indEmpresa.IG)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Índice de Gravedad</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{fmt(indEmpresa.IA)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Índice de Accidentabilidad</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{totEmpresa.diasPerdidos}</p>
            <p className="text-xs text-gray-400 mt-0.5">Días perdidos · {indEmpresa.totalAcc} acc.</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 flex flex-wrap gap-4 text-xs text-gray-400">
          <span>{totEmpresa.accidentesConTP} accidentes con TP</span>
          <span>{totEmpresa.accidentesSinTP} sin TP</span>
          <span>{totEmpresa.horasTrabajadas.toLocaleString()} horas trabajadas</span>
        </div>
      </div>

      {/* Fórmulas */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-xs text-blue-700 flex flex-wrap gap-4">
        <span><strong>IF</strong> = Acc.TP × 10⁶ / Horas</span>
        <span><strong>IG</strong> = Días perdidos × 10⁶ / Horas</span>
        <span><strong>IA</strong> = IF × IG / 10⁶</span>
      </div>

      {/* Grid por área */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-3">📊</p>
          <p className="text-sm">No hay datos cargados para este período.</p>
          {isAdmin && <p className="text-xs mt-1">Usa el botón "Cargar datos" para ingresar el primer registro.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsPorArea.filter(a => a.stats.length > 0).map(({ area, stats: aStats }) => (
            <AreaCard key={area} area={area} stats={aStats} />
          ))}
        </div>
      )}

      {/* Tabla detalle */}
      {filtered.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Detalle mensual</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-3 text-left">Mes</th>
                  <th className="px-3 py-3 text-left">Área</th>
                  <th className="px-3 py-3 text-right">Trab.</th>
                  <th className="px-3 py-3 text-right">Horas</th>
                  <th className="px-3 py-3 text-right">Acc. c/TP</th>
                  <th className="px-3 py-3 text-right">Acc. s/TP</th>
                  <th className="px-3 py-3 text-right">Días perd.</th>
                  <th className="px-3 py-3 text-right">IF</th>
                  <th className="px-3 py-3 text-right">IG</th>
                  <th className="px-3 py-3 text-right">IA</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {[...filtered].sort((a,b) => a.mes - b.mes || a.area.localeCompare(b.area)).map(s => {
                  const ind = calcIndicadores(s);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-500">{MESES[s.mes-1]}</td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">{s.area}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{s.trabajadores}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{s.horasTrabajadas.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-red-600">{s.accidentesConTP}</td>
                      <td className="px-3 py-2.5 text-right text-orange-500">{s.accidentesSinTP}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{s.diasPerdidos}</td>
                      <td className="px-3 py-2.5 text-right text-blue-700">{fmt(ind.IF)}</td>
                      <td className="px-3 py-2.5 text-right text-purple-700">{fmt(ind.IG)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-orange-600">{fmt(ind.IA)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && <CargaModal onClose={() => setShowModal(false)} onSaved={handleSaved} anioSel={anioFiltro} />}
    </div>
  );
}
