import { z } from 'zod'
import { calculateFloodRisk, calculateHeatRisk, type RiskResult, type StudyArea, demoAreas, selectedArea } from './types'

// ─── Conduit API Response Types ───

export type ConduitObservation = {
  ts: string
  rg1: string
  rg2: string
  rg1tt: string
  rg2tt: string
  rg1tp: string
  rg2tp: string
  temp_bmx: string
  press_bmx: string
  temp_mcp: string
  temp_sht: string
  humidity_sht: string
  si1145_vis: string
  si1145_ir: string
  si1145_uv: string
  wind_spd: string
  wind_dir: string
  wind_gust: string
  wind_gust_dir: string
  heat_idx: string
  wet_bulb_temp: string
  wet_bulb_globe_temp: string
}

export type ConduitApiResponse = {
  status: string
  headers: string[]
  data: ConduitObservation[]
}

// ─── Normalized Environmental Observation ───

export type EnvironmentalObservation = {
  timestamp: string
  temperature?: number
  temperatureBmx?: number
  temperatureMcp?: number
  temperatureSht?: number
  pressure?: number
  humidity?: number
  rainfallGauge1?: number
  rainfallGauge2?: number
  rainfallGauge1Today?: number
  rainfallGauge2Today?: number
  rainfallGauge1Prior?: number
  rainfallGauge2Prior?: number
  solarVisible?: number
  solarInfrared?: number
  uv?: number
  windSpeed?: number
  windDirection?: number
  windGust?: number
  windGustDirection?: number
  heatIndex?: number
  wetBulbTemperature?: number
  wetBulbGlobeTemperature?: number
  source: 'conduit'
}

// ─── Validation ───

const safeNumber = (val: string | undefined): number | undefined => {
  if (val === undefined || val === null || val === '') return undefined
  const n = Number(val)
  return Number.isFinite(n) ? n : undefined
}

const conduitObservationSchema = z.object({
  ts: z.string(),
  rg1: z.string(),
  rg2: z.string(),
  rg1tt: z.string(),
  rg2tt: z.string(),
  rg1tp: z.string(),
  rg2tp: z.string(),
  temp_bmx: z.string(),
  press_bmx: z.string(),
  temp_mcp: z.string(),
  temp_sht: z.string(),
  humidity_sht: z.string(),
  si1145_vis: z.string(),
  si1145_ir: z.string(),
  si1145_uv: z.string(),
  wind_spd: z.string(),
  wind_dir: z.string(),
  wind_gust: z.string(),
  wind_gust_dir: z.string(),
  heat_idx: z.string(),
  wet_bulb_temp: z.string(),
  wet_bulb_globe_temp: z.string(),
})

const conduitResponseSchema = z.object({
  status: z.string(),
  headers: z.array(z.string()),
  data: z.array(conduitObservationSchema),
})

// ─── Normalization ───

export function normalizeConduitObservation(obs: ConduitObservation): EnvironmentalObservation {
  return {
    timestamp: obs.ts,
    temperature: safeNumber(obs.temp_sht),
    temperatureBmx: safeNumber(obs.temp_bmx),
    temperatureMcp: safeNumber(obs.temp_mcp),
    temperatureSht: safeNumber(obs.temp_sht),
    pressure: safeNumber(obs.press_bmx),
    humidity: safeNumber(obs.humidity_sht),
    rainfallGauge1: safeNumber(obs.rg1),
    rainfallGauge2: safeNumber(obs.rg2),
    rainfallGauge1Today: safeNumber(obs.rg1tt),
    rainfallGauge2Today: safeNumber(obs.rg2tt),
    rainfallGauge1Prior: safeNumber(obs.rg1tp),
    rainfallGauge2Prior: safeNumber(obs.rg2tp),
    solarVisible: safeNumber(obs.si1145_vis),
    solarInfrared: safeNumber(obs.si1145_ir),
    uv: safeNumber(obs.si1145_uv),
    windSpeed: safeNumber(obs.wind_spd),
    windDirection: safeNumber(obs.wind_dir),
    windGust: safeNumber(obs.wind_gust),
    windGustDirection: safeNumber(obs.wind_gust_dir),
    heatIndex: safeNumber(obs.heat_idx),
    wetBulbTemperature: safeNumber(obs.wet_bulb_temp),
    wetBulbGlobeTemperature: safeNumber(obs.wet_bulb_globe_temp),
    source: 'conduit',
  }
}

// ─── Latest Observation Selection ───

export function getLatestObservation(observations: EnvironmentalObservation[]): EnvironmentalObservation | null {
  if (observations.length === 0) return null
  return observations.reduce((latest, current) => {
    return new Date(current.timestamp).getTime() > new Date(latest.timestamp).getTime()
      ? current
      : latest
  })
}

// ─── Rainfall Normalization for Risk Engine ───

// The Conduit rainfall gauge values (rg1, rg2) represent accumulated rainfall in mm.
// The TerraShield flood model expects rainfallIntensity on a 0-150 mm scale.
// We use the daily total (rg1tt) as the best available rainfall intensity proxy.
// If daily total is unavailable, we fall back to the gauge reading (rg1).
// The normalization maps the raw mm value to the 0-150 scale expected by the engine.
const RAINFALL_SCALE_MAX = 150

export function normalizeRainfallToRiskScale(obs: EnvironmentalObservation): number {
  const rainfallMm = obs.rainfallGauge1Today ?? obs.rainfallGauge1 ?? obs.rainfallGauge2Today ?? obs.rainfallGauge2 ?? 0
  return Math.max(0, Math.min(RAINFALL_SCALE_MAX, rainfallMm))
}

// ─── Temperature Extraction for Risk Engine ───

export function getConduitTemperature(obs: EnvironmentalObservation): number {
  return obs.temperatureSht ?? obs.temperature ?? obs.temperatureBmx ?? obs.temperatureMcp ?? 25
}

// ─── Risk Engine Integration ───

export function conduitFloodRisk(obs: EnvironmentalObservation, area: StudyArea): RiskResult {
  const rainfallIntensity = normalizeRainfallToRiskScale(obs)
  return calculateFloodRisk({
    rainfallIntensity,
    terrainSusceptibility: area.terrain,
    drainageSusceptibility: area.drainage,
  })
}

export function conduitHeatRisk(obs: EnvironmentalObservation, area: StudyArea): RiskResult {
  const temperatureC = getConduitTemperature(obs)
  return calculateHeatRisk({
    temperatureC,
    vegetationCoverage: area.vegetation,
    builtUpExposure: area.builtUp,
  })
}

// ─── Conduit API Fetch ───

export async function fetchConduitData(fromdate: string, todate: string): Promise<EnvironmentalObservation[]> {
  const apiUrl = process.env.CONDUIT_API_URL || 'https://conduit.jhubafrica.com/data.php'
  const apiKey = process.env.CONDUIT_API_KEY
  const email = process.env.CONDUIT_EMAIL

  if (!apiKey || !email) {
    throw new Error('CONDUIT_CREDENTIALS_MISSING')
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ apikey: apiKey, email, fromdate, todate }),
  })

  if (!response.ok) {
    throw new Error(`CONDUIT_HTTP_${response.status}`)
  }

  const raw: unknown = await response.json()
  const parsed = conduitResponseSchema.safeParse(raw)

  if (!parsed.success) {
    throw new Error('CONDUIT_INVALID_RESPONSE')
  }

  if (parsed.data.status !== 'success') {
    throw new Error('CONDUIT_API_ERROR')
  }

  if (!parsed.data.data || parsed.data.data.length === 0) {
    throw new Error('CONDUIT_NO_DATA')
  }

  return parsed.data.data.map(normalizeConduitObservation)
}

// ─── Conduit Climate Data Provider ───

export type ConduitData = {
  observations: EnvironmentalObservation[]
  latest: EnvironmentalObservation | null
  count: number
  source: 'conduit'
  fetchedAt: string
}

export type ConduitProviderResult = {
  data: ConduitData | null
  error: string | null
  fallback: boolean
}

export async function getConduitData(daysBack = 1): Promise<ConduitProviderResult> {
  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - daysBack)
  const fromdate = from.toISOString().slice(0, 10)
  const todate = today.toISOString().slice(0, 10)

  try {
    const observations = await fetchConduitData(fromdate, todate)
    const latest = getLatestObservation(observations)
    return {
      data: {
        observations,
        latest,
        count: observations.length,
        source: 'conduit',
        fetchedAt: new Date().toISOString(),
      },
      error: null,
      fallback: false,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CONDUIT_UNKNOWN_ERROR'
    return { data: null, error: message, fallback: true }
  }
}

// ─── Demo fallback for Conduit mode ───

export function getDemoFallbackData(): ConduitData {
  const now = new Date()
  const observations: EnvironmentalObservation[] = []
  for (let i = 0; i < 12; i++) {
    const ts = new Date(now.getTime() - i * 15 * 60 * 1000)
    observations.push({
      timestamp: ts.toISOString(),
      temperature: 24.5 + Math.sin(i * 0.5) * 2,
      temperatureSht: 24.5 + Math.sin(i * 0.5) * 2,
      temperatureBmx: 25.0 + Math.sin(i * 0.5) * 2,
      temperatureMcp: 24.0 + Math.sin(i * 0.5) * 2,
      pressure: 1013 + Math.cos(i * 0.3) * 2,
      humidity: 68 + Math.sin(i * 0.4) * 5,
      rainfallGauge1: 0,
      rainfallGauge2: 0,
      rainfallGauge1Today: 2.5,
      rainfallGauge2Today: 2.0,
      rainfallGauge1Prior: 0,
      rainfallGauge2Prior: 0,
      solarVisible: Math.max(0, 800 - i * 50),
      solarInfrared: Math.max(0, 200 - i * 10),
      uv: Math.max(0, 3.5 - i * 0.2),
      windSpeed: 8 + Math.sin(i * 0.6) * 3,
      windDirection: 180 + Math.cos(i * 0.4) * 20,
      windGust: 12 + Math.sin(i * 0.6) * 4,
      windGustDirection: 185 + Math.cos(i * 0.4) * 20,
      heatIndex: 25 + Math.sin(i * 0.5) * 2,
      wetBulbTemperature: 20 + Math.sin(i * 0.5) * 1.5,
      wetBulbGlobeTemperature: 21 + Math.sin(i * 0.5) * 1.5,
      source: 'conduit',
    })
  }
  return {
    observations,
    latest: observations[0],
    count: observations.length,
    source: 'conduit',
    fetchedAt: new Date().toISOString(),
  }
}

// ─── Conduit sensor field metadata for Data page ───

export const conduitSensorGroups = [
  {
    group: 'Precipitation',
    fields: [
      { field: 'rg1', label: 'Rainfall Gauge 1', unit: 'mm' },
      { field: 'rg2', label: 'Rainfall Gauge 2', unit: 'mm' },
      { field: 'rg1tt', label: 'Rainfall Gauge 1 (Today Total)', unit: 'mm' },
      { field: 'rg2tt', label: 'Rainfall Gauge 2 (Today Total)', unit: 'mm' },
      { field: 'rg1tp', label: 'Rainfall Gauge 1 (Prior Total)', unit: 'mm' },
      { field: 'rg2tp', label: 'Rainfall Gauge 2 (Prior Total)', unit: 'mm' },
    ],
  },
  {
    group: 'Temperature',
    fields: [
      { field: 'temp_bmx', label: 'Temperature (BME)', unit: '°C' },
      { field: 'temp_mcp', label: 'Temperature (MCP)', unit: '°C' },
      { field: 'temp_sht', label: 'Temperature (SHT)', unit: '°C' },
      { field: 'heat_idx', label: 'Heat Index', unit: '°C' },
      { field: 'wet_bulb_temp', label: 'Wet Bulb Temperature', unit: '°C' },
      { field: 'wet_bulb_globe_temp', label: 'Wet-Bulb Globe Temperature', unit: '°C' },
    ],
  },
  {
    group: 'Humidity',
    fields: [
      { field: 'humidity_sht', label: 'Relative Humidity (SHT)', unit: '%' },
    ],
  },
  {
    group: 'Atmospheric Pressure',
    fields: [
      { field: 'press_bmx', label: 'Atmospheric Pressure (BME)', unit: 'hPa' },
    ],
  },
  {
    group: 'Solar / UV',
    fields: [
      { field: 'si1145_vis', label: 'Solar Visible', unit: 'lx' },
      { field: 'si1145_ir', label: 'Solar Infrared', unit: 'lx' },
      { field: 'si1145_uv', label: 'UV Index', unit: 'UV' },
    ],
  },
  {
    group: 'Wind',
    fields: [
      { field: 'wind_spd', label: 'Wind Speed', unit: 'm/s' },
      { field: 'wind_dir', label: 'Wind Direction', unit: '°' },
      { field: 'wind_gust', label: 'Wind Gust', unit: 'm/s' },
      { field: 'wind_gust_dir', label: 'Wind Gust Direction', unit: '°' },
    ],
  },
] as const

// ─── Chart series definitions ───

export const conduitChartSeries = [
  { key: 'temperatureSht', label: 'Temperature (SHT)', unit: '°C', color: '#e76f51' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#4e806e' },
  { key: 'windSpeed', label: 'Wind Speed', unit: 'm/s', color: '#56816f' },
  { key: 'windGust', label: 'Wind Gust', unit: 'm/s', color: '#c18c32' },
  { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#4f806d' },
  { key: 'uv', label: 'UV Index', unit: 'UV', color: '#d8a84e' },
  { key: 'heatIndex', label: 'Heat Index', unit: '°C', color: '#b23a48' },
  { key: 'rainfallGauge1Today', label: 'Rainfall (Today Total)', unit: 'mm', color: '#397158' },
] as const

// ─── Status check ───

export function isConduitEnabled(): boolean {
  return process.env.CLIMATE_DATA_PROVIDER === 'conduit' &&
    process.env.CONDUIT_ENABLED === 'true'
}
