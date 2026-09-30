"use client";

import { useState } from "react";

const AREAS = ["Chocolate", "WET", "UHT", "Laboratorio Calidad", "Laboratorio Desarrollo", "Bodega CD", "Administración", "AXTEL", "PTAR"];
const CATEGORIAS = ["Proceso", "Equipo / maquinaria", "Instalación", "Requisito legal", "Nuevo proyecto / desarrollo", "Servicio nuevo o modificado", "Personal / organización", "Otro"];
const ESTADOS = ["Solicitado", "En evaluación", "Autorizado", "Rechazado", "Implementado", "Cerrado"];

const ESTADO_COLOR: Record<string, string> = {
  Solicitado: "bg-zinc-100 text-zinc-600",
  "En evaluación": "bg-amber-100 text-amber-700",
  Autorizado: "bg-blue-100 text-blue-700",
  Rechazado: "bg-red-100 text-red-700",
  Implementado: "bg-violet-100 text-violet-700",
  Cerrado: "bg-emerald-100 text-emerald-700",
};

interface Historial {
  id: string;
  paso: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  comentario: string | null;
  realizadoPor: string | null;
  createdAt: string;
}

export interface Cambio {
  id: string;
  codigo: string;
  numero: number;
  tipoCambio: string | null;
  naturalezaCambio: string | null;
  categoria: string | null;
  area: string | null;
  descripcion: string;
  motivo: string | null;
  fechaSolicitud: string;
  fechaImplementacionPrevista: string | null;
  solicitanteNombre: string | null;
  esSignificativo: boolean;
  peligrosIdentificados: string | null;
  riesgosEvaluados: string | null;
  controlesPropuestos: string | null;
  evaluadoPor: string | null;
  autorizadoPor: string | null;
  comentarioAutorizacion: string | null;
  requiereCapacitacion: boolean;
  requiereProcedimientos: boolean;
  requiereMatrizRiesgos: boolean;
  detalleActualizacion: string | null;
  responsableActualizacion: string | null;
  fechaImplementacion: string | null;
  seguimiento: string | null;
  responsableImplementacion: string | null;
  eficaz: boolean | null;
  validadoPor: string | null;
  observacionesValidacion: string | null;
  cicloRevision: number;
  estado: string;
  historial: Historial[];
}

function fmtFecha(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("es-CL");
}

// ── Formulario "Solicitar cambio" ───────────────────────────────────────────
function NuevoCambioForm({ userEmail, onClose, onSaved }: { userEmail: string | null; onClose: () => void; onSaved: (c: Cambio) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    tipoCambio: "", naturalezaCambio: "", categoria: "", area: "",
    descripcion: "", motivo: "", fechaImplementacionPrevista: "", esSignificativo: false,
  });
  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/gestion-cambio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, solicitanteNombre: userEmail }),
    });
    if (res.ok) {
      onSaved(await res.json());
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Error al guardar");
    }
    setSaving(false);
  }

  const inp = "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none";
  const lbl = "block text-xs font-medium text-zinc-600 mb-1";

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-zinc-100 rounded-xl p-6 space-y-4 max-w-2xl">
      <div className="bg-zinc-50 rounded-lg px-4 py-3 flex items-center gap-3">
        <span className="text-lg">👤</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Solicitado por</p>
          <p className="text-sm font-medium text-zinc-800">{userEmail ?? "Usuario activo"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Tipo de cambio *</label>
          <select className={inp} value={form.tipoCambio} onChange={(e) => set("tipoCambio", e.target.value)} required>
            <option value="">Seleccionar…</option>
            <option>Interno</option>
            <option>Externo</option>
          </select>
        </div>
        <div>
          <label className={lbl}>Naturaleza *</label>
          <select className={inp} value={form.naturalezaCambio} onChange={(e) => set("naturalezaCambio", e.target.value)} required>
            <option value="">Seleccionar…</option>
            <option>Permanente</option>
            <option>Temporal</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Categoría</label>
          <select className={inp} value={form.categoria} onChange={(e) => set("categoria", e.target.value)}>
            <option value="">Seleccionar…</option>
            {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Área *</label>
          <select className={inp} value={form.area} onChange={(e) => set("area", e.target.value)} required>
            <option value="">Seleccionar área…</option>
            {AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={lbl}>Descripción del cambio *</label>
        <textarea className={inp} rows={3} placeholder="Qué cambia exactamente, dónde y cuándo se planea implementar…"
          value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} required />
      </div>

      <div>
        <label className={lbl}>Motivo (opcional)</label>
        <textarea className={inp} rows={2} placeholder="Por qué se necesita este cambio…" value={form.motivo} onChange={(e) => set("motivo", e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <div>
          <label className={lbl}>Fecha prevista de implementación</label>
          <input className={inp} type="date" value={form.fechaImplementacionPrevista} onChange={(e) => set("fechaImplementacionPrevista", e.target.value)} />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 mb-1 cursor-pointer">
            <input type="checkbox" checked={form.esSignificativo} onChange={(e) => set("esSignificativo", e.target.checked)} />
            ¿Puede alterar significativamente calidad, SST o medio ambiente?
          </label>
          <p className="text-[11px] text-zinc-400">Si lo marcas, el cambio pasa por evaluación de peligros y riesgos antes de autorizarse.</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-between gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancelar</button>
        <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
          {saving ? "Guardando…" : "Registrar solicitud →"}
        </button>
      </div>
    </form>
  );
}

// ── Modal Detalle (flujo + bitácora) ────────────────────────────────────────
function DetalleCambioModal({ item, isAdmin, onClose, onUpdated }: {
  item: Cambio; isAdmin: boolean; onClose: () => void; onUpdated: (c: Cambio) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [peligros, setPeligros] = useState(item.peligrosIdentificados ?? "");
  const [riesgos, setRiesgos] = useState(item.riesgosEvaluados ?? "");
  const [controles, setControles] = useState(item.controlesPropuestos ?? "");
  const [evaluadoPor, setEvaluadoPor] = useState(item.evaluadoPor ?? "");

  const [autorizadoPor, setAutorizadoPor] = useState(item.autorizadoPor ?? "");
  const [comentarioAutorizacion, setComentarioAutorizacion] = useState(item.comentarioAutorizacion ?? "");

  const [reqCapacitacion, setReqCapacitacion] = useState(item.requiereCapacitacion);
  const [reqProcedimientos, setReqProcedimientos] = useState(item.requiereProcedimientos);
  const [reqMatriz, setReqMatriz] = useState(item.requiereMatrizRiesgos);
  const [detalleActualizacion, setDetalleActualizacion] = useState(item.detalleActualizacion ?? "");
  const [responsableActualizacion, setResponsableActualizacion] = useState(item.responsableActualizacion ?? "");

  const [fechaImplementacion, setFechaImplementacion] = useState(item.fechaImplementacion?.slice(0, 10) ?? "");
  const [seguimiento, setSeguimiento] = useState(item.seguimiento ?? "");
  const [responsableImplementacion, setResponsableImplementacion] = useState(item.responsableImplementacion ?? "");

  const [observacionesValidacion, setObservacionesValidacion] = useState(item.observacionesValidacion ?? "");
  const [validadoPor, setValidadoPor] = useState(item.validadoPor ?? "");

  async function avanzar(accion: string, campos: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch("/api/gestion-cambio", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, accion, ...campos }),
    });
    if (res.ok) onUpdated(await res.json());
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Error al actualizar");
    }
    setBusy(false);
  }

  // Misma lógica de visibilidad de pasos que FMA — igual firma que
  // actualizarVisibilidadPasosCambio en el PGI-25 de FMAnormaAI.
  let showEval = false, showAutoriz = false, showPlanes = false, showImplement = false, showValidacion = false;
  if (item.estado === "Solicitado") {
    if (item.esSignificativo) showEval = true;
    else showAutoriz = true;
  } else if (item.estado === "En evaluación") {
    showAutoriz = true;
  } else if (item.estado === "Autorizado") {
    if (!item.detalleActualizacion) showPlanes = true;
    else showImplement = true;
  } else if (item.estado === "Implementado") {
    showValidacion = true;
  }

  const inp = "w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-[#C41230] focus:ring-2 focus:ring-[#C41230]/20 outline-none";
  const cardCls = "bg-zinc-50 rounded-xl p-4 space-y-3";
  const cardTitleCls = "text-sm font-semibold text-zinc-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{item.codigo}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[item.estado] ?? "bg-zinc-100 text-zinc-500"}`}>{item.estado}</span>
              {item.tipoCambio && <span className="text-xs text-zinc-400">{item.tipoCambio}</span>}
              {item.naturalezaCambio && <span className="text-xs text-zinc-400">· {item.naturalezaCambio}</span>}
              {item.cicloRevision > 1 && <span className="text-xs text-amber-600">· Ciclo {item.cicloRevision}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-zinc-400">Área: </span><span className="text-zinc-700">{item.area}</span></div>
            <div><span className="text-zinc-400">Categoría: </span><span className="text-zinc-700">{item.categoria ?? "—"}</span></div>
            <div><span className="text-zinc-400">Solicitante: </span><span className="text-zinc-700">{item.solicitanteNombre ?? "—"}</span></div>
            <div><span className="text-zinc-400">Fecha prevista: </span><span className="text-zinc-700">{fmtFecha(item.fechaImplementacionPrevista)}</span></div>
          </div>

          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Descripción del cambio</p>
            <p className="text-sm text-zinc-700 bg-zinc-50 rounded-lg p-3">{item.descripcion}</p>
            {item.motivo && <p className="text-xs text-zinc-400 mt-1">Motivo: {item.motivo}</p>}
          </div>

          {/* Paso 2 · Evaluación */}
          {showEval && (
            <div className={cardCls}>
              <p className={cardTitleCls}>② Evaluación de impacto — peligros, riesgos y controles</p>
              <textarea className={inp} rows={2} placeholder="Peligros identificados…" value={peligros} onChange={(e) => setPeligros(e.target.value)} />
              <textarea className={inp} rows={2} placeholder="Riesgos evaluados…" value={riesgos} onChange={(e) => setRiesgos(e.target.value)} />
              <textarea className={inp} rows={2} placeholder="Controles propuestos para eliminar o mitigar…" value={controles} onChange={(e) => setControles(e.target.value)} />
              <input className={inp} placeholder="Evaluado por…" value={evaluadoPor} onChange={(e) => setEvaluadoPor(e.target.value)} />
              {isAdmin && (
                <button disabled={busy} onClick={() => avanzar("evaluar", { peligrosIdentificados: peligros, riesgosEvaluados: riesgos, controlesPropuestos: controles, evaluadoPor })}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
                  Guardar evaluación →
                </button>
              )}
            </div>
          )}

          {/* Paso 3 · Autorización */}
          {showAutoriz && (
            <div className={cardCls}>
              <p className={cardTitleCls}>③ Autorización del cambio</p>
              <input className={inp} placeholder="Nombre de quien autoriza…" value={autorizadoPor} onChange={(e) => setAutorizadoPor(e.target.value)} />
              <textarea className={inp} rows={2} placeholder="Comentario (opcional)…" value={comentarioAutorizacion} onChange={(e) => setComentarioAutorizacion(e.target.value)} />
              {isAdmin && (
                <div className="flex gap-2 flex-wrap">
                  <button disabled={busy} onClick={() => avanzar("autorizar", { autorizadoPor, comentarioAutorizacion })}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
                    ✓ Autorizar cambio
                  </button>
                  <button disabled={busy} onClick={() => avanzar("rechazar", { comentarioAutorizacion })}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60">
                    ✕ Rechazar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Paso 4 · Actualización de planes */}
          {showPlanes && (
            <div className={cardCls}>
              <p className={cardTitleCls}>④ Actualización de planes y procedimientos</p>
              <div className="flex gap-4 flex-wrap text-sm text-zinc-600">
                <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={reqCapacitacion} onChange={(e) => setReqCapacitacion(e.target.checked)} />Plan de capacitación</label>
                <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={reqProcedimientos} onChange={(e) => setReqProcedimientos(e.target.checked)} />Procedimientos</label>
                <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={reqMatriz} onChange={(e) => setReqMatriz(e.target.checked)} />Matriz de riesgos</label>
              </div>
              <textarea className={inp} rows={2} placeholder="Detalle de qué se actualizó…" value={detalleActualizacion} onChange={(e) => setDetalleActualizacion(e.target.value)} />
              <input className={inp} placeholder="Responsable de la actualización…" value={responsableActualizacion} onChange={(e) => setResponsableActualizacion(e.target.value)} />
              {isAdmin && (
                <button disabled={busy} onClick={() => avanzar("actualizar_planes", {
                  requiereCapacitacion: reqCapacitacion, requiereProcedimientos: reqProcedimientos, requiereMatrizRiesgos: reqMatriz,
                  detalleActualizacion, responsableActualizacion,
                })} className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
                  Guardar y continuar →
                </button>
              )}
            </div>
          )}

          {/* Paso 5 · Implementación */}
          {showImplement && (
            <div className={cardCls}>
              <p className={cardTitleCls}>⑤ Implementación y seguimiento</p>
              <input className={inp} type="date" value={fechaImplementacion} onChange={(e) => setFechaImplementacion(e.target.value)} />
              <textarea className={inp} rows={2} placeholder="Seguimiento realizado a los controles…" value={seguimiento} onChange={(e) => setSeguimiento(e.target.value)} />
              <input className={inp} placeholder="Responsable de la implementación…" value={responsableImplementacion} onChange={(e) => setResponsableImplementacion(e.target.value)} />
              {isAdmin && (
                <button disabled={busy} onClick={() => avanzar("implementar", { fechaImplementacion, seguimiento, responsableImplementacion })}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
                  Registrar implementación →
                </button>
              )}
            </div>
          )}

          {/* Paso 6 · Validación de eficacia */}
          {showValidacion && (
            <div className={cardCls}>
              <p className={cardTitleCls}>⑥ Validación de la eficacia</p>
              <textarea className={inp} rows={2} placeholder="Observaciones de la validación…" value={observacionesValidacion} onChange={(e) => setObservacionesValidacion(e.target.value)} />
              <input className={inp} placeholder="Validado por…" value={validadoPor} onChange={(e) => setValidadoPor(e.target.value)} />
              {isAdmin && (
                <div className="flex gap-2 flex-wrap">
                  <button disabled={busy} onClick={() => avanzar("validar_eficaz", { observacionesValidacion, validadoPor })}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-[#C41230] hover:bg-[#a00e26] disabled:opacity-60">
                    ✓ Fue eficaz — cerrar cambio
                  </button>
                  <button disabled={busy} onClick={() => avanzar("validar_no_eficaz", { observacionesValidacion, validadoPor })}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-60">
                    ↺ No fue eficaz — reevaluar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bitácora — siempre visible, es el flujo completo del proceso */}
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide font-semibold mb-2">⟳ Bitácora del cambio</p>
            <div className="space-y-0">
              {item.historial.map((h, i) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${i === item.historial.length - 1 ? "bg-[#C41230]" : "bg-zinc-300"}`} />
                    {i < item.historial.length - 1 && <div className="w-px flex-1 bg-zinc-200" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-zinc-800">{h.paso}{h.estadoNuevo && ` → ${h.estadoNuevo}`}</p>
                    {h.comentario && <p className="text-xs text-zinc-500 mt-0.5">{h.comentario}</p>}
                    <p className="text-xs text-zinc-400 mt-0.5">{h.realizadoPor ?? "—"} · {new Date(h.createdAt).toLocaleString("es-CL")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function GestionCambioClient({ items: initial, isAdmin, userEmail }: {
  items: Cambio[]; isAdmin: boolean; userEmail: string | null;
}) {
  const [items, setItems] = useState<Cambio[]>(initial);
  const [tab, setTab] = useState<"historico" | "nueva">("historico");
  const [filEstado, setFilEstado] = useState("");
  const [selected, setSelected] = useState<Cambio | null>(null);
  const [showProcedimiento, setShowProcedimiento] = useState(false);

  const filtered = items.filter((i) => !filEstado || i.estado === filEstado);

  function handleCreado(c: Cambio) {
    setItems((prev) => [c, ...prev]);
    setTab("historico");
  }

  function handleUpdated(c: Cambio) {
    setItems((prev) => prev.map((i) => (i.id === c.id ? c : i)));
    setSelected(c);
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta solicitud de cambio?")) return;
    const res = await fetch(`/api/gestion-cambio?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setSelected(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Gestión del Cambio</h1>
          <p className="text-sm text-zinc-500 mt-0.5">ISO 9001 · 6.3 — ISO 14001 / ISO 45001 · 8.1.3 — {items.length} registros</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab("historico")}
          className={`px-4 py-2 text-sm font-medium rounded-lg border ${tab === "historico" ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
          ≡ Histórico
        </button>
        {isAdmin && (
          <button onClick={() => setTab("nueva")}
            className={`px-4 py-2 text-sm font-medium rounded-lg border ${tab === "nueva" ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
            + Solicitar cambio
          </button>
        )}
      </div>

      <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
        <button onClick={() => setShowProcedimiento((v) => !v)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-zinc-50">
          <span className="text-sm font-semibold text-zinc-800">📖 Procedimiento · Gestión del Cambio</span>
          <span className="text-xs text-[#C41230]">{showProcedimiento ? "Ocultar ▴" : "Ver detalle ▾"}</span>
        </button>
        {showProcedimiento && (
          <div className="px-5 pb-4 text-sm text-zinc-600 leading-relaxed">
            <p className="mb-2">Todo cambio que pueda impactar la integridad del sistema de gestión, la disponibilidad de recursos o la asignación de responsabilidades debe planificarse y controlarse — sean cambios internos o externos, permanentes o temporales: nuevos procesos, equipos, instalaciones, requisitos legales o proyectos.</p>
            <ol className="list-decimal list-inside space-y-1 mb-2">
              <li>Se identifica y registra el cambio.</li>
              <li>Si altera de forma significativa las condiciones de calidad, SST o medio ambiente, se identifican peligros, se evalúan riesgos y se definen controles.</li>
              <li>Se autoriza el cambio y sus controles.</li>
              <li>Se actualizan capacitación, procedimientos y matriz de riesgos según corresponda.</li>
              <li>Se implementa y se hace seguimiento a los controles.</li>
              <li>Se valida la eficacia — si no fue eficaz, se vuelve a evaluar el impacto.</li>
            </ol>
            <p>Aplica a ISO 9001:2015, ISO 14001:2015 e ISO 45001:2018.</p>
          </div>
        )}
      </div>

      {tab === "nueva" && isAdmin && (
        <NuevoCambioForm userEmail={userEmail} onClose={() => setTab("historico")} onSaved={handleCreado} />
      )}

      {tab === "historico" && (
        <>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilEstado("")}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${filEstado === "" ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
              Todas
            </button>
            {ESTADOS.map((e) => (
              <button key={e} onClick={() => setFilEstado(e)}
                className={`px-3 py-1 rounded-full text-xs font-medium border ${filEstado === e ? "bg-[#C41230] text-white border-[#C41230]" : "bg-white text-zinc-600 border-zinc-200 hover:border-[#C41230]"}`}>
                {e}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm">No hay cambios registrados para este filtro.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <button key={item.id} onClick={() => setSelected(item)}
                  className="w-full text-left bg-white border border-zinc-100 rounded-xl px-5 py-4 hover:border-[#C41230]/40 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-zinc-400">{item.codigo}</span>
                        <span className="text-xs text-zinc-400">{item.area}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[item.estado] ?? "bg-zinc-100 text-zinc-500"}`}>{item.estado}</span>
                        {item.esSignificativo && <span className="text-xs text-amber-600">· Significativo</span>}
                      </div>
                      <p className="text-sm text-zinc-800 truncate">{item.descripcion}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); handleEliminar(item.id); }} className="text-zinc-300 hover:text-red-500 text-lg leading-none shrink-0">×</button>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selected && <DetalleCambioModal item={selected} isAdmin={isAdmin} onClose={() => setSelected(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
