// Clima operacional — Open-Meteo (gratis, sin API key) en vez de scrapear
// meteored.cl, que no tiene API pública. Coordenadas de la planta de
// Puratos Chile en Santiago.
const LATITUDE = -33.4489;
const LONGITUDE = -70.6693;

// Umbrales de alerta — ajustables si el usuario pide otros valores.
export const WEATHER_THRESHOLDS = {
  tempAltaC: 30,
  uvAlto: 8,
  lluviaProbPct: 70,
};

export interface WeatherNow {
  tempC: number;
  uvIndex: number;
  precipProbPct: number;
  precipMm: number;
  tempMaxHoyC: number;
  alertas: {
    tempAlta: boolean;
    uvAlto: boolean;
    lluvia: boolean;
  };
}

export async function getWeatherNow(): Promise<WeatherNow | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
      `&current=temperature_2m,uv_index,precipitation` +
      `&daily=temperature_2m_max,precipitation_probability_max` +
      `&timezone=America%2FSantiago`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const tempC = data?.current?.temperature_2m;
    const uvIndex = data?.current?.uv_index;
    const precipMm = data?.current?.precipitation;
    const precipProbPct = data?.daily?.precipitation_probability_max?.[0];
    const tempMaxHoyC = data?.daily?.temperature_2m_max?.[0];

    if ([tempC, uvIndex, precipMm, precipProbPct, tempMaxHoyC].some((v) => typeof v !== "number")) {
      return null;
    }

    return {
      tempC,
      uvIndex,
      precipProbPct,
      precipMm,
      tempMaxHoyC,
      alertas: {
        tempAlta: tempMaxHoyC >= WEATHER_THRESHOLDS.tempAltaC,
        uvAlto: uvIndex >= WEATHER_THRESHOLDS.uvAlto,
        lluvia: precipProbPct >= WEATHER_THRESHOLDS.lluviaProbPct,
      },
    };
  } catch {
    // Si Open-Meteo falla, el dashboard sigue funcionando sin esta tarjeta.
    return null;
  }
}
