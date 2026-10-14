import type { WeatherNow } from "@/lib/weather";

export function WeatherCard({ weather }: { weather: WeatherNow }) {
  const { alertas } = weather;
  const uvRequiereProteccion = alertas.uvAlto || alertas.uvPorHorarioEstacional;
  const hayAlerta =
    alertas.tempAlta || alertas.tempFria || uvRequiereProteccion || alertas.lluvia || alertas.vientoFuerte || alertas.condicionSevera;

  return (
    <div
      className={`rounded-lg border p-4 shadow-sm ${
        hayAlerta
          ? "border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {hayAlerta && <span className="text-lg">⚠️</span>}
          <p className={`text-sm font-medium uppercase tracking-wide ${hayAlerta ? "text-amber-800 dark:text-amber-300" : "text-zinc-500 dark:text-zinc-400"}`}>
            Clima — Santiago
          </p>
        </div>
        <span className="text-xs text-zinc-400">{weather.condicion}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric
          label="Temperatura"
          value={`${Math.round(weather.tempC)}°`}
          sub={`máx. hoy ${Math.round(weather.tempMaxHoyC)}°`}
          alert={alertas.tempAlta || alertas.tempFria}
        />
        <Metric
          label="Índice UV"
          value={String(Math.round(weather.uvIndex))}
          sub={uvLabel(weather.uvIndex)}
          alert={uvRequiereProteccion}
        />
        <Metric
          label="Lluvia"
          value={`${Math.round(weather.precipProbPct)}%`}
          sub={weather.precipMm > 0 ? `${weather.precipMm.toFixed(1)} mm ahora` : "prob. hoy"}
          alert={alertas.lluvia}
        />
        <Metric
          label="Viento"
          value={`${Math.round(weather.windKmh)}`}
          sub="km/h"
          alert={alertas.vientoFuerte}
        />
      </div>

      {hayAlerta && (
        <ul className="mt-3 space-y-1 border-t border-amber-200 pt-2 text-xs text-amber-800 dark:border-amber-900/50 dark:text-amber-300">
          {alertas.tempFria && <li>• Frío: temperatura ≤10°C — evaluar exposición, ropa adecuada y descansos en zonas temperadas.</li>}
          {alertas.tempAlta && <li>• Temperatura alta — seguimiento de exposición al calor según tarea.</li>}
          {uvRequiereProteccion && <li>• Radiación UV: activar protección solar (no implica suspender el trabajo).</li>}
          {alertas.lluvia && <li>• Probabilidad alta de lluvia — considerar en tareas a la intemperie.</li>}
          {alertas.vientoFuerte && <li>• Viento fuerte — revisar criterios por tarea (grúas, altura, andamios).</li>}
          {alertas.condicionSevera && <li>• Condición severa en curso ({weather.condicion}) — evaluar riesgo grave e inminente si corresponde.</li>}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-snug text-zinc-400">
        Referencia meteorológica (Open-Meteo), no reemplaza la medición de TGBH en terreno ni las alertas oficiales DMC/SENAPRED.
      </p>
    </div>
  );
}

function uvLabel(uv: number) {
  if (uv >= 11) return "Extremo";
  if (uv >= 8) return "Muy alto";
  if (uv >= 6) return "Alto";
  if (uv >= 3) return "Moderado";
  return "Bajo";
}

function Metric({ label, value, sub, alert }: { label: string; value: string; sub: string; alert: boolean }) {
  return (
    <div>
      <p className="text-xs text-zinc-400">{label}</p>
      <p className={`text-xl font-bold ${alert ? "text-amber-700 dark:text-amber-400" : "text-zinc-900 dark:text-zinc-50"}`}>
        {value}
      </p>
      <p className="text-xs text-zinc-400">{sub}</p>
    </div>
  );
}
