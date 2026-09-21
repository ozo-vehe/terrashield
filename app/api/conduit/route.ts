import { NextRequest, NextResponse } from 'next/server'

export type ConduitObservation = {
  ts: string
  rg1: string; rg2: string
  rg1tt: string; rg2tt: string
  rg1tp: string; rg2tp: string
  temp_bmx: string; press_bmx: string
  temp_mcp: string; temp_sht: string
  humidity_sht: string
  si1145_vis: string; si1145_ir: string; si1145_uv: string
  wind_spd: string; wind_dir: string
  wind_gust: string; wind_gust_dir: string
  heat_idx: string
  wet_bulb_temp: string; wet_bulb_globe_temp: string
}

export type ConduitApiResponse = {
  status: string
  headers: string[]
  data: ConduitObservation[]
}

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

function normalizeConduitObservation(obs: ConduitObservation): EnvironmentalObservation {
  return {
    timestamp: obs.ts,
    temperature: Number(obs.temp_sht) || undefined,
    temperatureBmx: Number(obs.temp_bmx) || undefined,
    temperatureMcp: Number(obs.temp_mcp) || undefined,
    temperatureSht: Number(obs.temp_sht) || undefined,
    pressure: Number(obs.press_bmx) || undefined,
    humidity: Number(obs.humidity_sht) || undefined,
    rainfallGauge1: Number(obs.rg1) || undefined,
    rainfallGauge2: Number(obs.rg2) || undefined,
    rainfallGauge1Today: Number(obs.rg1tt) || undefined,
    rainfallGauge2Today: Number(obs.rg2tt) || undefined,
    rainfallGauge1Prior: Number(obs.rg1tp) || undefined,
    rainfallGauge2Prior: Number(obs.rg2tp) || undefined,
    solarVisible: Number(obs.si1145_vis) || undefined,
    solarInfrared: Number(obs.si1145_ir) || undefined,
    uv: Number(obs.si1145_uv) || undefined,
    windSpeed: Number(obs.wind_spd) || undefined,
    windDirection: Number(obs.wind_dir) || undefined,
    windGust: Number(obs.wind_gust) || undefined,
    windGustDirection: Number(obs.wind_gust_dir) || undefined,
    heatIndex: Number(obs.heat_idx) || undefined,
    wetBulbTemperature: Number(obs.wet_bulb_temp) || undefined,
    wetBulbGlobeTemperature: Number(obs.wet_bulb_globe_temp) || undefined,
    source: 'conduit',
  }
}

export function normalizeRainfallToRiskScale(rainfallMm: number): number {
  // Scale rainfall in mm to 0-100 risk scale
  // Max threshold: 150mm produces score of 100
  // Below 5mm produces near-zero score
  // Linear interpolation between these points
  const maxThreshold = 150
  const minThreshold = 0
  const scaled = Math.max(0, Math.min(100, (rainfallMm / maxThreshold) * 100))
  return Math.round(scaled)
}

export async function GET(request: NextRequest) {
  const fromdate = request.nextUrl.searchParams.get('fromdate')
  const todate = request.nextUrl.searchParams.get('todate')

  // Validate environment variables
  const apiUrl = process.env.CONDUIT_API_URL
  const apiKey = process.env.CONDUIT_API_KEY
  const email = process.env.CONDUIT_EMAIL

  if (!apiUrl || !apiKey || !email) {
    return NextResponse.json(
      {
        error: {
          code: 'CONDUIT_UNAVAILABLE',
          message: 'Conduit API credentials are not configured.',
        },
      },
      { status: 503 }
    )
  }

  // Validate date parameters
  if (!fromdate || !todate) {
    return NextResponse.json(
      {
        error: {
          code: 'MISSING_DATE_PARAMS',
          message: 'Both fromdate and todate are required (YYYY-MM-DD format).',
        },
      },
      { status: 400 }
    )
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromdate) || !/^\d{4}-\d{2}-\d{2}$/.test(todate)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_DATE_FORMAT',
          message: 'Dates must be in YYYY-MM-DD format.',
        },
      },
      { status: 400 }
    )
  }

  try {
    const body = new URLSearchParams({
      apikey: apiKey,
      email: email,
      fromdate: fromdate,
      todate: todate,
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`Conduit API returned ${response.status}`)
    }

    const data: ConduitApiResponse = await response.json()

    if (data.status !== 'success') {
      throw new Error(`Conduit API status: ${data.status}`)
    }

    if (!data.data || data.data.length === 0) {
      return NextResponse.json({
        status: 'success',
        observations: [],
        latest: null,
        count: 0,
        dateRange: { fromdate, todate },
      })
    }

    // Normalize all observations
    const normalized = data.data.map(normalizeConduitObservation)

    // Find latest observation by timestamp
    const latest = normalized.reduce((l, c) => {
      const lTime = new Date(l.timestamp).getTime()
      const cTime = new Date(c.timestamp).getTime()
      return cTime > lTime ? c : l
    })

    return NextResponse.json({
      status: 'success',
      observations: normalized,
      latest: latest,
      count: normalized.length,
      dateRange: { fromdate, todate },
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Conduit API error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'CONDUIT_FETCH_FAILED',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch Conduit data',
        },
      },
      { status: 502 }
    )
  }
}
