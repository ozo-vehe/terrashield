import { NextRequest, NextResponse } from 'next/server'
import { fetchConduitData, normalizeConduitObservation, getLatestObservation } from '@/lib/climate/conduit'

export async function GET(request: NextRequest) {
  const fromdate = request.nextUrl.searchParams.get('fromdate')
  const todate = request.nextUrl.searchParams.get('todate')
  const days = Number(request.nextUrl.searchParams.get('days')) || 1

  const today = new Date()
  const from = new Date(today)
  from.setDate(from.getDate() - days)
  const finalFromdate = fromdate || from.toISOString().slice(0, 10)
  const finalTodate = todate || today.toISOString().slice(0, 10)

  const apiKey = process.env.CONDUIT_API_KEY
  const email = process.env.CONDUIT_EMAIL
  const conduitEnabled = process.env.CONDUIT_ENABLED === 'true'

  if (!conduitEnabled) {
    return NextResponse.json({
      error: { code: 'CONDUIT_DISABLED', message: 'Conduit integration is not enabled.' },
      fallback: true,
    }, { status: 503 })
  }

  if (!apiKey || !email) {
    return NextResponse.json({
      error: { code: 'CONDUIT_NOT_CONFIGURED', message: 'Conduit API credentials are not configured on the server.' },
      fallback: true,
    }, { status: 503 })
  }

  try {
    const observations = await fetchConduitData(finalFromdate, finalTodate)
    const latest = getLatestObservation(observations)

    if (!latest) {
      return NextResponse.json({
        error: { code: 'CONDUIT_NO_DATA', message: 'No observations were returned for the requested period.' },
        fallback: true,
      }, { status: 502 })
    }

    return NextResponse.json({
      source: 'JKUAT Conduit Weather Station',
      fetchedAt: new Date().toISOString(),
      fromdate: finalFromdate,
      todate: finalTodate,
      count: observations.length,
      latest,
      observations,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'CONDUIT_UNKNOWN_ERROR'
    const userMessage = message === 'CONDUIT_CREDENTIALS_MISSING'
      ? 'Conduit API credentials are not configured on the server.'
      : message === 'CONDUIT_INVALID_RESPONSE'
      ? 'The Conduit API returned an invalid response.'
      : message === 'CONDUIT_API_ERROR'
      ? 'The Conduit API reported an error status.'
      : message === 'CONDUIT_NO_DATA'
      ? 'No observations were returned for the requested period.'
      : message.startsWith('CONDUIT_HTTP_')
      ? `The Conduit API returned an HTTP error (${message.replace('CONDUIT_HTTP_', '')}).`
      : 'Unable to retrieve the latest JKUAT Conduit observations.'

    return NextResponse.json({
      error: { code: message, message: userMessage },
      fallback: true,
    }, { status: 502 })
  }
}
