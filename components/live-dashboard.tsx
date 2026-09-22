'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Droplets, MapPin, ShieldCheck, Sun, SlidersHorizontal, CircleAlert as AlertCircle, Activity, Wind, Gauge } from 'lucide-react'
import { calculateFloodRisk, calculateHeatRisk, demoAreas, riskLabel, riskLevel, selectedArea, disclaimer, demoBadgeLabel, liveBadgeLabel, fallbackLocationMessage, fallbackWeatherMessage, conduitBadgeLabel, conduitObservedLabel, conduitStationName } from '@/lib/climate/types'
import ConduitConditions from '@/components/conduit-conditions'
import type { EnvironmentalObservation } from '@/lib/climate/conduit'

type Weather = { current: { temperature_2m: number; relative_humidity_2m: number; precipitation: number; rain: number; wind_speed_10m: number; weather_code: number }; timezone: string }
type Location = { lat: number; lng: number; label: string }
const fallback: Location = { lat: selectedArea?.lat ?? 9.0765, lng: selectedArea?.lng ?? 7.3986, label: 'Abuja demo data' }
const score = (value: number) => Math.max(0, Math.min(100, Math.round(value)))
function Badge({ value }: { value: number }) { return <span className={`risk-${riskLevel(value)} rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase`}>{riskLabel(riskLevel(value))}</span> }
function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9d8cc] bg-[#f1f5ef] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#397158]" title="These values are synthetic demonstration data created for the TerraShield prototype. They are not official measurements, forecasts, or administrative boundaries.">
      <span className="size-1.5 rounded-full bg-[#5e9a75]" />
      {demoBadgeLabel}
    </span>
  )
}
function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8d7c2] bg-[#dcebdc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#376044]" title={disclaimer}>
      <span className="size-1.5 rounded-full bg-[#4e806e]" />
      {liveBadgeLabel}
    </span>
  )
}

type ConduitApiResponse = {
  latest?: EnvironmentalObservation
  count?: number
  error?: { code: string; message: string }
  fallback?: boolean
}

export default function LiveDashboard() {
  const [location, setLocation] = useState(fallback)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [status, setStatus] = useState('Loading live weather…')
  const [isLive, setIsLive] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)
  const [conduitData, setConduitData] = useState<ConduitApiResponse | null>(null)
  const [conduitLoading, setConduitLoading] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(fallback)
      setIsFallback(true)
      setFallbackReason(fallbackLocationMessage)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude, label: 'Your current location' }),
      () => {
        setLocation(fallback)
        setIsFallback(true)
        setFallbackReason(fallbackLocationMessage)
      },
      { timeout: 5000 }
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    setStatus('Loading live weather…')
    fetch(`/api/weather?lat=${location.lat}&lng=${location.lng}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((v) => {
        if (cancelled) return
        setWeather(v.data)
        setIsLive(true)
        setIsFallback(false)
        setStatus(`Live · ${v.fetchedAt ? new Date(v.fetchedAt).toLocaleTimeString() : 'updated now'}`)
      })
      .catch(() => {
        if (cancelled) return
        setWeather(null)
        setIsLive(false)
        setIsFallback(true)
        setFallbackReason(fallbackWeatherMessage)
        setStatus(fallbackWeatherMessage)
      })
    return () => { cancelled = true }
  }, [location])

  useEffect(() => {
    let cancelled = false
    setConduitLoading(true)
    fetch('/api/conduit/weather?days=1')
      .then((r) => r.json())
      .then((v: ConduitApiResponse) => {
        if (cancelled) return
        setConduitData(v)
        setConduitLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setConduitData({ error: { code: 'FETCH_FAILED', message: 'Unable to retrieve Conduit data.' }, fallback: true })
        setConduitLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const demoArea = selectedArea ?? demoAreas[0]
  const conduitLatest = conduitData?.latest
  const conduitActive = conduitLatest !== undefined

  const metrics = useMemo(() => {
    if (conduitActive) {
      const o = conduitLatest!
      const rainfallMm = o.rainfallGauge1Today ?? o.rainfallGauge1 ?? o.rainfallGauge2Today ?? o.rainfallGauge2 ?? 0
      const tempC = o.temperatureSht ?? o.temperature ?? o.temperatureBmx ?? o.temperatureMcp ?? 25
      const flood = calculateFloodRisk({
        rainfallIntensity: Math.max(0, Math.min(150, rainfallMm)),
        terrainSusceptibility: demoArea.terrain,
        drainageSusceptibility: demoArea.drainage,
      })
      const heat = calculateHeatRisk({
        temperatureC: tempC,
        vegetationCoverage: demoArea.vegetation,
        builtUpExposure: demoArea.builtUp,
      })
      return { flood, heat, source: 'conduit' as const, tempC, rainfallMm }
    }
    if (weather && isLive) {
      const c = weather.current
      const flood = calculateFloodRisk({ rainfallIntensity: score(c.precipitation * 30 + c.rain * 20), terrainSusceptibility: score(c.relative_humidity_2m * .7), drainageSusceptibility: score(c.precipitation > 0 ? 65 : 25) })
      const heat = calculateHeatRisk({ temperatureC: c.temperature_2m, vegetationCoverage: score(100 - c.relative_humidity_2m), builtUpExposure: score(c.temperature_2m * 2) })
      return { flood, heat, source: 'open-meteo' as const, tempC: c.temperature_2m, rainfallMm: c.precipitation }
    }
    const flood = calculateFloodRisk({ rainfallIntensity: 80, terrainSusceptibility: demoArea.terrain, drainageSusceptibility: demoArea.drainage })
    const heat = calculateHeatRisk({ temperatureC: demoArea.temperature, vegetationCoverage: demoArea.vegetation, builtUpExposure: demoArea.builtUp })
    return { flood, heat, source: 'demo' as const, tempC: demoArea.temperature, rainfallMm: 2.5 }
  }, [weather, isLive, demoArea, conduitActive, conduitLatest])

  const dataSourceLabel = metrics.source === 'conduit'
    ? 'JKUAT Conduit observed data'
    : metrics.source === 'open-meteo'
    ? 'Live weather (Open-Meteo)'
    : 'Demo scenario inputs'

  return (
    <div className="min-h-screen bg-[#f6f7f2] text-[#18332b]">
      <header className="border-b border-[#dbe4dc] bg-[#f6f7f2]/90">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-xl bg-[#18332b] text-white"><ShieldCheck className="size-5" /></span>
            Terra<span className="text-[#c18c32]">Shield</span>
          </Link>
          <nav className="flex gap-5 text-sm text-[#5a7067]">
            <Link href="/map">Risk map</Link>
            <Link href="/scenarios">Scenario lab</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="flex items-center gap-2 text-xs text-[#71887d]">
              <MapPin className="size-3" />
              {location.label} · {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
            {metrics.source === 'conduit' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8d7c2] bg-[#dcebdc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#376044]" title="Real environmental observations from the JKUAT Conduit Weather Station.">
                <span className="size-1.5 rounded-full bg-[#4e806e] animate-pulse" />
                {conduitBadgeLabel} · {conduitObservedLabel}
              </span>
            ) : isLive ? <LiveBadge /> : <DemoBadge />}
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-.055em]">Climate risk overview</h1>
          <p className="mt-2 text-sm text-[#71887d]">
            {metrics.source === 'conduit'
              ? 'Real observations from the JKUAT Conduit Weather Station feed TerraShield\'s modeled risk assessment. Scores are modeled estimates, not official forecasts or warnings.'
              : isLive
              ? 'Live weather observations are used as inputs to TerraShield\'s prototype risk model. Risk scores are modeled estimates and are not official forecasts or warnings.'
              : 'Modeled risk scores based on synthetic demonstration data. These are not official forecasts or warnings.'}
          </p>
          <p className="mt-3 text-xs font-medium text-[#4e806e]" role="status">{status}</p>
          {isFallback && fallbackReason && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#e9c46a]/40 bg-[#fff9e9] px-3 py-2 text-xs text-[#805d16]" role="alert">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{fallbackReason}</span>
            </div>
          )}
        </div>

        {/* Risk score cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-5">
            <Droplets className="size-4 text-[#4e806e]" />
            <p className="mt-4 text-3xl font-semibold">{metrics.flood.score}<span className="text-sm font-normal text-[#8ba097]"> /100</span></p>
            <Badge value={metrics.flood.score} />
            <p className="mt-3 text-xs text-[#80958b]">{metrics.source === 'conduit' ? `Conduit rainfall: ${metrics.rainfallMm.toFixed(1)} mm` : dataSourceLabel}</p>
          </div>
          <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-5">
            <Sun className="size-4 text-[#c18c32]" />
            <p className="mt-4 text-3xl font-semibold">{metrics.heat.score}<span className="text-sm font-normal text-[#8ba097]"> /100</span></p>
            <Badge value={metrics.heat.score} />
            <p className="mt-3 text-xs text-[#80958b]">{metrics.source === 'conduit' ? `Conduit temp: ${metrics.tempC.toFixed(1)}°C` : dataSourceLabel}</p>
          </div>
          <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-5">
            <p className="text-sm text-[#71887d]">Temperature</p>
            <p className="mt-3 text-3xl font-semibold">{metrics.tempC.toFixed(1)}°C</p>
            <p className="mt-2 text-xs text-[#80958b]">{metrics.source === 'conduit' && conduitLatest?.humidity !== undefined ? `Humidity ${conduitLatest.humidity.toFixed(0)}%` : (weather && isLive ? `Humidity ${weather.current.relative_humidity_2m}%` : `Humidity 65%`)}</p>
          </div>
          <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-5">
            <p className="text-sm text-[#71887d]">Precipitation</p>
            <p className="mt-3 text-3xl font-semibold">{metrics.rainfallMm.toFixed(1)} mm</p>
            <p className="mt-2 text-xs text-[#80958b]">{metrics.source === 'conduit' && conduitLatest?.windSpeed !== undefined ? `Wind ${conduitLatest.windSpeed.toFixed(1)} m/s` : (weather && isLive ? `Wind ${weather.current.wind_speed_10m.toFixed(0)} km/h` : 'Wind 8 km/h')}</p>
          </div>
        </div>

        {/* Conduit risk explanation */}
        {conduitActive && (
          <div className="mt-5 rounded-2xl border border-[#b8d7c2] bg-[#edf5ec] p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#18332b] text-[#dcebdc]"><Activity className="size-4" /></span>
              <div className="text-sm leading-6 text-[#397158]">
                <strong className="text-[#18332b]">Risk engine input:</strong> The latest JKUAT Conduit observation recorded <strong>{metrics.tempC.toFixed(1)}°C</strong> and <strong>{metrics.rainfallMm.toFixed(1)} mm</strong> of rainfall at the weather station. These observed values feed the temperature and rainfall components of TerraShield&apos;s modeled risk assessment.
              </div>
            </div>
          </div>
        )}

        {/* Real Conduit conditions panel */}
        <div className="mt-5">
          <ConduitConditions />
        </div>

        {/* Risk drivers */}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Droplets className="size-4 text-[#4e806e]" />
              <h2 className="text-sm font-semibold">Flood risk drivers</h2>
            </div>
            <div className="space-y-4">
              {metrics.flood.factors.map((f) => (
                <div key={f.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-[#5a7067]">{Math.round(f.contribution)} pts</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e3ebe3]">
                    <div className="h-full rounded-full bg-[#4f806d]" style={{ width: `${Math.min(100, f.contribution * 2)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[#80958b]">{f.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-[#e5ece6] pt-3 text-xs leading-5 text-[#71887d]">{metrics.flood.explanation}</p>
          </div>
          <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sun className="size-4 text-[#c18c32]" />
              <h2 className="text-sm font-semibold">Heat risk drivers</h2>
            </div>
            <div className="space-y-4">
              {metrics.heat.factors.map((f) => (
                <div key={f.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-[#5a7067]">{Math.round(f.contribution)} pts</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#e3ebe3]">
                    <div className="h-full rounded-full bg-[#4f806d]" style={{ width: `${Math.min(100, f.contribution * 2)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[#80958b]">{f.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-[#e5ece6] pt-3 text-xs leading-5 text-[#71887d]">{metrics.heat.explanation}</p>
          </div>
        </div>

        {/* Decision support / scenario CTA */}
        <div className="mt-6 rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Explore this location</h2>
              <p className="mt-2 text-sm text-[#71887d]">Open the live map to move to another location, or adjust the weather-driven assumptions in Scenario Lab — starting from real Conduit observations.</p>
            </div>
            <Link href="/scenarios" className="inline-flex items-center gap-2 rounded-full bg-[#18332b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#315548]">
              <SlidersHorizontal className="size-4" />
              Run a scenario
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/map" className="rounded-full border border-[#c9d8cc] px-4 py-2 text-sm font-semibold text-[#315548] hover:bg-[#f0f3f1]">Open live map <ArrowRight className="ml-1 inline size-4" /></Link>
            <Link href={`/areas/${demoArea.id}`} className="rounded-full border border-[#c9d8cc] px-4 py-2 text-sm font-semibold text-[#315548] hover:bg-[#f0f3f1]">View area details <ArrowRight className="ml-1 inline size-4" /></Link>
          </div>
        </div>

        <p className="mt-6 text-xs leading-5 text-[#80958b]">{disclaimer}</p>
      </main>
    </div>
  )
}
