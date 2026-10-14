import type { WeatherNow } from "@/lib/weather";

export function WeatherCard({ weather }: { weather: WeatherNow }) {
  const hayAlerta = weather.alertas.tempAlta || weather.alertas.uvAlto || weather.alertas.lluvia;

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
        {hayAlerta && (
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            Condición que puede afectar la operación
          </span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Metric
          label="Temperatura"
          value={`${Math.round(weather.tempC)}°`}
          sub={`máx. hoy ${Math.round(weather.tempMaxHoyC)}°`}
          alert={weather.alertas.tempAlta}
        />
        <Metric
          label="Índice UV"
          value={String(Math.round(weather.uvIndex))}
          sub={uvLabel(weather.uvIndex)}
          alert={weather.alertas.uvAlto}
        />
        <Metric
          label="Lluvia"
          value={`${Math.round(weather.precipProbPct)}%`}
          sub={weather.precipMm > 0 ? `${weather.precipMm.toFixed(1)} mm ahora` : "prob. hoy"}
          alert={weather.alertas.lluvia}
        />
      </div>
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
