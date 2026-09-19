import { NextRequest, NextResponse } from 'next/server'

const weatherUrl = 'https://api.open-meteo.com/v1/forecast'

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get('lat'))
  const lng = Number(request.nextUrl.searchParams.get('lng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: { code: 'INVALID_COORDINATES', message: 'Valid latitude and longitude are required.' } }, { status: 400 })
  }

  const url = new URL(weatherUrl)
  url.search = new URLSearchParams({
    latitude: String(lat), longitude: String(lng), timezone: 'auto',
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m',
    hourly: 'precipitation_probability,precipitation', forecast_days: '1',
  }).toString()

  try {
    const response = await fetch(url, { next: { revalidate: 900 } })
    if (!response.ok) throw new Error(`Weather provider returned ${response.status}`)
    const data = await response.json()
    return NextResponse.json({ source: 'Open-Meteo', fetchedAt: new Date().toISOString(), coordinates: { lat, lng }, data })
  } catch {
    return NextResponse.json({ error: { code: 'WEATHER_UNAVAILABLE', message: 'Live weather is temporarily unavailable.' } }, { status: 502 })
  }
}
