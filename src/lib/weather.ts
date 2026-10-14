// Clima operacional — Open-Meteo (gratis, sin API key) en vez de scrapear
// meteored.cl, que no tiene API pública. Coordenadas de la planta de
// Puratos Chile en Santiago.
//
// Umbrales alineados a criterios normativos chilenos de exposición laboral
// a condiciones climáticas (radiación UV, frío), con las limitaciones
// anotadas abajo:
//
// - Calor ocupacional (TGBH/WBGT): el protocolo exige una medición física
//   en el puesto de trabajo (termómetro de globo), cruzada con el esfuerzo
//   físico de cada tarea y su razón trabajo/descanso — no es un dato que
//   una API de clima pueda entregar ni aproximar de forma confiable. No se
//   implementa acá; requiere instrumento en terreno.
// - Alertas oficiales DMC/SENAPRED: no se integran — son fuentes propias
//   del Estado sin API pública conocida (la alternativa sería scrapear sus
//   sitios, con el mismo problema de fragilidad que se descartó para
//   meteored.cl). El umbral de "temperatura alta" de acá es una referencia
//   propia, no el feed oficial.
// - Riesgo grave e inminente / orden de evacuación: es una decisión humana
//   y procedimental, no un valor numérico — no corresponde a esta tarjeta.
const LATITUDE = -33.4489;
const LONGITUDE = -70.6693;

export const WEATHER_THRESHOLDS = {
  // Temperatura ambiente alta — referencia propia (no feed oficial DMC/SENAPRED).
  tempAltaC: 30,
  // Frío al aire libre: temperatura ≤10°C se considera crítica (lluvia y
  // viento agravan el riesgo).
  tempFriaC: 10,
  // Radiación UV: índice ≥6 activa medidas de protección en cualquier época
  // del año (no es prohibición automática de trabajar). Set/Mar 10-17h bajo
  // sol directo también aplica aunque el índice sea menor a 6.
  uvAlto: 6,
  lluviaProbPct: 70,
  // Viento fuerte — referencia propia; la norma no fija un único límite,
  // se aplica según tarea/equipo (grúas, trabajo en altura, etc.).
  vientoFuerteKmh: 50,
};

const WMO_CONDICION: Record<number, { label: string; severo?: boolean }> = {
  0: { label: "Despejado" },
  1: { label: "Mayormente despejado" },
  2: { label: "Parcialmente nublado" },
  3: { label: "Nublado" },
  45: { label: "Niebla" },
  48: { label: "Niebla con escarcha" },
  51: { label: "Llovizna débil" },
  53: { label: "Llovizna" },
  55: { label: "Llovizna intensa" },
  56: { label: "Llovizna helada" },
  57: { label: "Llovizna helada intensa" },
  61: { label: "Lluvia débil" },
  63: { label: "Lluvia" },
  65: { label: "Lluvia intensa", severo: true },
  66: { label: "Lluvia helada" },
  67: { label: "Lluvia helada intensa", severo: true },
  71: { label: "Nevada débil" },
  73: { label: "Nevada" },
  75: { label: "Nevada intensa", severo: true },
  77: { label: "Gránulos de nieve" },
  80: { label: "Chubascos débiles" },
  81: { label: "Chubascos" },
  82: { label: "Chubascos intensos", severo: true },
  85: { label: "Chubascos de nieve" },
  86: { label: "Chubascos de nieve intensos", severo: true },
  95: { label: "Tormenta eléctrica", severo: true },
  96: { label: "Tormenta eléctrica con granizo", severo: true },
  99: { label: "Tormenta eléctrica con granizo intenso", severo: true },
};

function esTemporadaUvAlta(fecha: Date): boolean {
  // 1 sept - 31 marzo
  const mes = fecha.getMonth() + 1; // 1-12
  return mes >= 9 || mes <= 3;
}

function esHorarioUvCritico(fecha: Date): boolean {
  const hora = fecha.getHours();
  return hora >= 10 && hora < 17;
}

export interface WeatherNow {
  tempC: number;
  uvIndex: number;
  precipProbPct: number;
  precipMm: number;
  tempMaxHoyC: number;
  windKmh: number;
  condicion: string;
  alertas: {
    tempAlta: boolean;
    tempFria: boolean;
    uvAlto: boolean;
    uvPorHorarioEstacional: boolean;
    lluvia: boolean;
    vientoFuerte: boolean;
    condicionSevera: boolean;
  };
}

export async function getWeatherNow(): Promise<WeatherNow | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
      `&current=temperature_2m,uv_index,precipitation,wind_speed_10m,weather_code` +
      `&daily=temperature_2m_max,precipitation_probability_max` +
      `&timezone=America%2FSantiago`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const tempC = data?.current?.temperature_2m;
    const uvIndex = data?.current?.uv_index;
    const precipMm = data?.current?.precipitation;
    const windKmh = data?.current?.wind_speed_10m;
    const weatherCode = data?.current?.weather_code;
    const precipProbPct = data?.daily?.precipitation_probability_max?.[0];
    const tempMaxHoyC = data?.daily?.temperature_2m_max?.[0];

    if ([tempC, uvIndex, precipMm, windKmh, weatherCode, precipProbPct, tempMaxHoyC].some((v) => typeof v !== "number")) {
      return null;
    }

    const ahora = new Date();
    const uvPorHorarioEstacional = esTemporadaUvAlta(ahora) && esHorarioUvCritico(ahora);
    const condicionInfo = WMO_CONDICION[weatherCode] ?? { label: "—" };

    return {
      tempC,
      uvIndex,
      precipProbPct,
      precipMm,
      tempMaxHoyC,
      windKmh,
      condicion: condicionInfo.label,
      alertas: {
        tempAlta: tempMaxHoyC >= WEATHER_THRESHOLDS.tempAltaC,
        tempFria: tempC <= WEATHER_THRESHOLDS.tempFriaC,
        uvAlto: uvIndex >= WEATHER_THRESHOLDS.uvAlto,
        uvPorHorarioEstacional,
        lluvia: precipProbPct >= WEATHER_THRESHOLDS.lluviaProbPct,
        vientoFuerte: windKmh >= WEATHER_THRESHOLDS.vientoFuerteKmh,
        condicionSevera: !!condicionInfo.severo,
      },
    };
  } catch {
    // Si Open-Meteo falla, el dashboard sigue funcionando sin esta tarjeta.
    return null;
  }
}
