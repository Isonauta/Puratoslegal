"use client";

import { useState } from "react";

const AREAS = ["Chocolate", "WET", "UHT", "Laboratorio Calidad", "Laboratorio Desarrollo", "Bodega CD", "Administración", "AXTEL", "PTAR"];
const AMBITOS = ["SST", "MA", "SGI"];
const TIPOS = ["Interna", "Externa", "Auditoria", "Cliente"];
const IMPACTOS = ["Alto", "Medio", "Bajo"];
const ESTADOS = ["Abierta", "En revisión", "En corrección", "Cerrada"];

const ESTADO_COLORS: Record<string, string> = {
  "Abierta":       "bg-red-100 text-red-700",
  "En revisión":   "bg-amber-100 text-amber-700",
  "En corrección": "bg-blue-100 text-blue-700",
  "Cerrada":       "bg-green-100 text-green-700",
};

const IMPACTO_COLORS: Record<string, string> = {
  "Alto":  "bg-red-50 text-red-600 border border-red-200",
  "Medio": "bg-amber-50 text-amber-600 border border-amber-200",
  "Bajo":  "bg-green-50 text-green-600 border border-green-200",
};

interface NC {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string;
  area: string;
  ambito: string;
  tipo: string;
  origen: string | null;
  impacto: string;
  estado: string;
  fechaDeteccion: string;
  fechaLimite: string | null;
  fechaCierre: string | null;
  responsable: string | null;
  accionInmediata: string | null;
  accionCorrectiva: string | null;
  accionPreventiva: string | null;
  evidencia: string | null;
  verificadoPor: string | null;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL");
}

// ─── Modal Registro ──────────────────────────────────────────────────────────
function RegistroModal({ onClose, onSaved }: { onClose: () => void; onSaved: (nc: NC) => void }) {
  const [form, setForm] = useState({
    titulo: "", descripcion: "", area: AREAS[0], ambito: "SST",
    tipo: "Interna", origen: "", impacto: "Medio",
    fechaDeteccion: new Date().toISOString().slice(0, 10),
    fechaLimite: "", responsable: "", accionInmediata: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/no-conformidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      onSaved(await res.json());
      onClose();
    } else {
      const d = await res.json();
      setError(d.error ?? "Error al guardar");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-bold text-zinc-900">Nueva No Conformidad</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-600">Título *</label>
            <input required value={form.titulo} onChange={e => set("titulo", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Descripción *</label>
            <textarea required rows={3} value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-600">Área *</label>
              <select value={form.area} onChange={e => set("area", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none">
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Ámbito</label>
              <select value={form.ambito} onChange={e => set("ambito", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none">
                {AMBITOS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-600">Tipo</label>
              <select value={form.tipo} onChange={e => set("tipo", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none">
                {TIPOS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Impacto</label>
              <select value={form.impacto} onChange={e => set("impacto", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none">
                {IMPACTOS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-600">Fecha detección</label>
              <input type="date" value={form.fechaDeteccion} onChange={e => set("fechaDeteccion", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600">Fecha límite</label>
              <input type="date" value={form.fechaLimite} onChange={e => set("fechaLimite", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Responsable</label>
            <input value={form.responsable} onChange={e => set("responsable", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Origen / Contexto</label>
            <input value={form.origen} onChange={e => set("origen", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Acción inmediata</label>
            <textarea rows={2} value={form.accionInmediata} onChange={e => set("accionInmediata", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 text-sm font-semibold bg-[#C41230] text-white rounded-lg hover:bg-[#a30f26] disabled:opacity-60 transition-colors">
              {saving ? "Guardando..." : "Registrar NC"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Detalle / Actualización ──────────────────────────────────────────
function DetalleModal({ nc, onClose, onUpdated }: { nc: NC; onClose: () => void; onUpdated: (nc: NC) => void }) {
  const [estado, setEstado] = useState(nc.estado);
  const [accionCorrectiva, setAccionCorrectiva] = useState(nc.accionCorrectiva ?? "");
  const [accionPreventiva, setAccionPreventiva] = useState(nc.accionPreventiva ?? "");
  const [evidencia, setEvidencia] = useState(nc.evidencia ?? "");
  const [verificadoPor, setVerificadoPor] = useState(nc.verificadoPor ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/no-conformidades", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: nc.id, estado, accionCorrectiva, accionPreventiva, evidencia, verificadoPor }),
    });
    setSaving(false);
    if (res.ok) { onUpdated(await res.json()); onClose(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <span className="text-xs text-zinc-400">NC-{String(nc.numero).padStart(4, "0")}</span>
            <h2 className="text-base font-bold text-zinc-900">{nc.titulo}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-zinc-400 text-xs">Área</span><p className="font-medium">{nc.area}</p></div>
            <div><span className="text-zinc-400 text-xs">Ámbito</span><p className="font-medium">{nc.ambito}</p></div>
            <div><span className="text-zinc-400 text-xs">Tipo</span><p className="font-medium">{nc.tipo}</p></div>
            <div><span className="text-zinc-400 text-xs">Impacto</span>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-semibold ${IMPACTO_COLORS[nc.impacto]}`}>{nc.impacto}</span>
            </div>
            <div><span className="text-zinc-400 text-xs">Detectada</span><p className="font-medium">{fmt(nc.fechaDeteccion)}</p></div>
            <div><span className="text-zinc-400 text-xs">Fecha límite</span><p className="font-medium">{fmt(nc.fechaLimite)}</p></div>
          </div>
          <div>
            <p className="text-xs text-zinc-400">Descripción</p>
            <p className="text-sm text-zinc-700 mt-1">{nc.descripcion}</p>
          </div>
          {nc.accionInmediata && (
            <div>
              <p className="text-xs text-zinc-400">Acción inmediata</p>
              <p className="text-sm text-zinc-700 mt-1">{nc.accionInmediata}</p>
            </div>
          )}

          <hr className="border-zinc-100" />

          {/* Editable */}
          <div>
            <label className="text-xs font-medium text-zinc-600">Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none">
              {ESTADOS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Acción correctiva</label>
            <textarea rows={2} value={accionCorrectiva} onChange={e => setAccionCorrectiva(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Acción preventiva</label>
            <textarea rows={2} value={accionPreventiva} onChange={e => setAccionPreventiva(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Evidencia</label>
            <input value={evidencia} onChange={e => setEvidencia(e.target.value)}
              placeholder="URL o descripción del documento"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">Verificado por</label>
            <input value={verificadoPor} onChange={e => setVerificadoPor(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700">Cerrar</button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 text-sm font-semibold bg-[#C41230] text-white rounded-lg hover:bg-[#a30f26] disabled:opacity-60 transition-colors">
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function NoConformidadesClient({ items: initial, isAdmin }: { items: NC[]; isAdmin: boolean }) {
  const [items, setItems] = useState<NC[]>(initial);
  const [showRegistro, setShowRegistro] = useState(false);
  const [selected, setSelected] = useState<NC | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [filtroAmbito, setFiltroAmbito] = useState("Todos");

  const filtered = items.filter(nc =>
    (filtroEstado === "Todas" || nc.estado === filtroEstado) &&
    (filtroAmbito === "Todos" || nc.ambito === filtroAmbito)
  );

  const byEstado = (e: string) => items.filter(nc => nc.estado === e).length;
  const abiertas = byEstado("Abierta");
  const enRevision = byEstado("En revisión") + byEstado("En corrección");
  const cerradas = byEstado("Cerrada");
  const altoImpacto = items.filter(nc => nc.impacto === "Alto" && nc.estado !== "Cerrada").length;

  function onSaved(nc: NC) { setItems(prev => [nc, ...prev]); }
  function onUpdated(nc: NC) { setItems(prev => prev.map(x => x.id === nc.id ? nc : x)); }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">No Conformidades</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Registro y seguimiento de no conformidades del SIG</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowRegistro(true)}
            className="flex items-center gap-2 bg-[#C41230] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#a30f26] transition-colors">
            <span className="text-lg leading-none">+</span> Registrar NC
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Abiertas</p>
          <p className={`text-2xl font-bold mt-1 ${abiertas > 0 ? "text-red-600" : "text-zinc-800"}`}>{abiertas}</p>
        </div>
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <p className="text-xs text-zinc-400">En proceso</p>
          <p className={`text-2xl font-bold mt-1 ${enRevision > 0 ? "text-amber-600" : "text-zinc-800"}`}>{enRevision}</p>
        </div>
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Cerradas</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{cerradas}</p>
        </div>
        <div className="bg-white border border-zinc-100 rounded-xl p-4">
          <p className="text-xs text-zinc-400">Alto impacto pendientes</p>
          <p className={`text-2xl font-bold mt-1 ${altoImpacto > 0 ? "text-red-600" : "text-zinc-800"}`}>{altoImpacto}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {["Todas", ...ESTADOS].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filtroEstado === e ? "bg-[#C41230] text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}>
            {e}
          </button>
        ))}
        <div className="ml-auto">
          <select value={filtroAmbito} onChange={e => setFiltroAmbito(e.target.value)}
            className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 outline-none">
            <option>Todos</option>
            {AMBITOS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">
          {items.length === 0 ? "No hay no conformidades registradas aún." : "No hay resultados para los filtros seleccionados."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(nc => {
            const vencida = nc.fechaLimite && nc.estado !== "Cerrada" && new Date(nc.fechaLimite) < new Date();
            return (
              <button key={nc.id} onClick={() => setSelected(nc)}
                className="w-full text-left bg-white border border-zinc-100 hover:border-[#C41230] rounded-xl px-4 py-3 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-400 shrink-0">NC-{String(nc.numero).padStart(4, "0")}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_COLORS[nc.estado] ?? "bg-zinc-100 text-zinc-600"}`}>
                        {nc.estado}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${IMPACTO_COLORS[nc.impacto]}`}>
                        {nc.impacto}
                      </span>
                      {vencida && <span className="text-xs text-red-500 font-semibold">⚠ Vencida</span>}
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 truncate">{nc.titulo}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{nc.area} · {nc.ambito} · {nc.tipo}</p>
                  </div>
                  <div className="text-xs text-zinc-400 shrink-0 text-right">
                    <p>{fmt(nc.fechaDeteccion)}</p>
                    {nc.fechaLimite && <p className={vencida ? "text-red-500 font-medium" : ""}>Límite: {fmt(nc.fechaLimite)}</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modales */}
      {showRegistro && <RegistroModal onClose={() => setShowRegistro(false)} onSaved={onSaved} />}
      {selected && (
        <DetalleModal
          nc={selected}
          onClose={() => setSelected(null)}
          onUpdated={(nc) => { onUpdated(nc); setSelected(null); }}
        />
      )}
    </div>
  );
}
