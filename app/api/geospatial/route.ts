import { NextRequest, NextResponse } from 'next/server'

const numberParam = (value: string | null) => Number(value)

export async function GET(request: NextRequest) {
  const lat = numberParam(request.nextUrl.searchParams.get('lat'))
  const lng = numberParam(request.nextUrl.searchParams.get('lng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: { code: 'INVALID_COORDINATES', message: 'Valid latitude and longitude are required.' } }, { status: 400 })
  }

  const radius = 5000
  const overpassQuery = `[out:json][timeout:12];(way(around:${radius},${lat},${lng})[waterway];way(around:${radius},${lat},${lng})[natural=water];);out tags center;`
  try {
    const [elevationResult, placesResult, reverseResult] = await Promise.allSettled([
      fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`, { next: { revalidate: 86400 } }),
      fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`, { next: { revalidate: 21600 } }),
      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, { headers: { 'user-agent': 'TerraShield/1.0 climate-risk-research' }, next: { revalidate: 86400 } }),
    ])
    const elevationResponse = elevationResult.status === 'fulfilled' ? elevationResult.value : null
    const placesResponse = placesResult.status === 'fulfilled' ? placesResult.value : null
    const reverseResponse = reverseResult.status === 'fulfilled' ? reverseResult.value : null
    const elevation = elevationResponse?.ok ? await elevationResponse.json() : null
    const drainage = placesResponse?.ok ? await placesResponse.json() : null
    const reverse = reverseResponse?.ok ? await reverseResponse.json() : null
    const waterways = Array.isArray(drainage?.elements) ? drainage.elements.length : null
    return NextResponse.json({
      source: { elevation: 'Open-Meteo / ERA5', drainage: 'OpenStreetMap Overpass', location: 'OpenStreetMap Nominatim' },
      fetchedAt: new Date().toISOString(), coordinates: { lat, lng },
      location: reverse?.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      elevationMeters: Array.isArray(elevation?.elevation) ? elevation.elevation[0] ?? null : null,
      drainage: { nearbyWaterways: waterways, radiusMeters: radius, status: 'observed-features' },
      vegetation: { status: 'unavailable', message: 'Connect Sentinel Hub or Google Earth Engine for satellite NDVI.' },
    })
  } catch {
    return NextResponse.json({ error: { code: 'GEOSPATIAL_UNAVAILABLE', message: 'Live terrain and drainage data are temporarily unavailable.' } }, { status: 502 })
  }
}
