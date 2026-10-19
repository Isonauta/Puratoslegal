import WindyMap from "@/components/WindyMap";
import type { WeatherNow } from "@/lib/weather";
import type { AnalisisParteInteresada } from "@/lib/climaPartesInteresadas";

const LATITUDE = -33.4489;
const LONGITUDE = -70.6693;

export default function TiempoMeteorologicoTab({ weather, condicionesActivas, analisis, error }: {
  weather: WeatherNow | null; condicionesActivas: string[]; analisis: AnalisisParteInteresada[]; error?: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Clima actual en Santiago y su cruce con la matriz real de Partes Interesadas — se recalcula con cada actualización del clima (como máximo cada 1 hora).
      </p>

      <WindyMap lat={LATITUDE} lon={LONGITUDE} nombre="Santiago" />

      <div className="bg-white border border-zinc-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-zinc-800 mb-0.5">¿A quién podría afectar el clima de hoy?</p>
        <p className="text-xs text-zinc-500 mb-4">
          Análisis generado en tiempo real cruzando el clima actual con las necesidades/expectativas reales registradas en Partes Interesadas — no es un ejemplo fijo.
        </p>

        {!weather && (
          <p className="text-sm text-zinc-400">No se pudo obtener el clima en este momento.</p>
        )}

        {weather && condicionesActivas.length === 0 && (
          <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-4 py-3">
            Sin condiciones climáticas que ameriten revisión hoy — no se identifican afectaciones a partes interesadas.
          </p>
        )}

        {weather && condicionesActivas.length > 0 && (
          <>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {condicionesActivas.map((c) => (
                <span key={c} className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{c}</span>
              ))}
            </div>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            {analisis.length === 0 && !error && (
              <p className="text-sm text-zinc-500">
                Hay condiciones activas hoy, pero ninguna parte interesada registrada tiene una necesidad o expectativa con conexión real a ellas.
              </p>
            )}

            {analisis.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analisis.map((a) => (
                  <div key={a.parteInteresadaId} className="bg-amber-50/60 border border-amber-100 rounded-lg px-4 py-3">
                    <p className="text-sm font-semibold text-zinc-800">{a.nombre}</p>
                    <p className="text-xs text-zinc-600 mt-1">{a.analisis}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
