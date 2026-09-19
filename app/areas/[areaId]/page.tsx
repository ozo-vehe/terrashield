'use client'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowLeft, ChartBar as BarChart3, CloudRain, Droplets, Sun, Trees, ShieldCheck, Info, CircleAlert as AlertCircle } from 'lucide-react'
import {
  demoAreas,
  calculateFloodRisk,
  riskLabel,
  riskLevel,
  overallRisk,
  disclaimer,
  buildRisk,
  areaCoordinates,
  demoBadgeLabel,
  liveBadgeLabel,
} from '@/lib/climate/types'

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#dbe4dc]/80 bg-[#f6f7f2]/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-[#18332b] hover:text-[#315548]">
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
      </div>
    </header>
  )
}

function ScoreCard({ title, score, icon: Icon }: { title: string; score: number; icon: typeof Droplets }) {
  const level = riskLevel(score)
  const colors: Record<string, string> = {
    low: 'bg-[#84a98c] text-white',
    moderate: 'bg-[#e9c46a] text-[#18332b]',
    high: 'bg-[#e76f51] text-white',
    'very-high': 'bg-[#b23a48] text-white',
  }
  return (
    <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="size-5 text-[#4e806e]" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-4xl font-semibold tracking-[-.06em] text-[#18332b]">
            {score}
            <span className="ml-2 text-lg font-normal text-[#8ba097]">/100</span>
          </div>
          <div className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${colors[level]}`}>
            {riskLabel(level)}
          </div>
        </div>
      </div>
    </div>
  )
}

function WeatherCard({ lat, lng }: { lat: number; lng: number }) {
  const { data, error, isLoading } = useSWR(`/api/weather?lat=${lat}&lng=${lng}`, (url) => fetch(url).then((response) => response.json()))
  const current = data?.data?.current
  const labels: Record<number, string> = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 61: 'Rain', 63: 'Moderate rain', 65: 'Heavy rain', 80: 'Rain showers', 95: 'Thunderstorm' }

  return <div className="rounded-2xl border border-[#c9d8cc] bg-[#edf5ec] p-6">
    <div className="flex items-start justify-between gap-4">
      <div><div className="flex items-center gap-2"><div className="text-xs font-semibold uppercase tracking-[.12em] text-[#55766a]">Live conditions</div>{!error && !data?.error && current && <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8d7c2] bg-[#dcebdc] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.08em] text-[#376044]" title="Current weather observations from Open-Meteo. Risk scores are modeled estimates.">{liveBadgeLabel}</span>}</div><h2 className="mt-2 text-xl font-semibold text-[#18332b]">Current weather at this location</h2></div>
      <CloudRain className="size-6 text-[#4e806e]" />
    </div>
    {isLoading && <p className="mt-5 text-sm text-[#71887d]" role="status">Loading live weather…</p>}
    {error || data?.error ? <p className="mt-5 text-sm text-[#a64b3a]" role="alert">Live weather is temporarily unavailable. Modeled scores remain available.</p> : current && <div className="mt-5 grid gap-4 sm:grid-cols-4">
      {[[`${Math.round(current.temperature_2m)}°C`, 'Temperature'], [`${Math.round(current.apparent_temperature)}°C`, 'Feels like'], [`${current.relative_humidity_2m}%`, 'Humidity'], [`${Math.round(current.wind_speed_10m)} km/h`, 'Wind']].map(([value, label]) => <div key={label} className="rounded-xl border border-[#d5e3d4] bg-white/70 p-4"><div className="text-xl font-semibold text-[#18332b]">{value}</div><div className="mt-1 text-xs text-[#71887d]">{label}</div></div>)}
      <div className="sm:col-span-4 text-sm text-[#55766a]">{labels[current.weather_code] ?? 'Current conditions'} · Precipitation: {current.precipitation} mm · Source: Open-Meteo · Live observations used as model inputs</div>
    </div>}
    <p className="mt-4 text-xs leading-5 text-[#71887d]">Weather observations are live. Area risk scores and environmental characteristics are synthetic demo data.</p>
  </div>
}

function FactorsSection({ hazard, result }: { hazard: 'flood' | 'heat'; result: ReturnType<typeof calculateFloodRisk> }) {
  return (
    <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{hazard === 'flood' ? 'Flood' : 'Heat'} risk drivers</div>
          <div className="mt-1 text-xs text-[#80958b]">What contributes to this score</div>
        </div>
        <BarChart3 className="size-5 text-[#739282]" />
      </div>
      <div className="flex flex-col gap-5">
        {result.factors.map((f) => (
          <div key={f.name}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium">{f.name}</span>
              <span className="font-semibold text-[#18332b]">{Math.round(f.contribution)} pts</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#e3ebe3]">
              <div className="h-full rounded-full bg-[#4f806d]" style={{ width: `${Math.min(100, f.contribution * 2)}%` }} />
            </div>
            <div className="mt-1 text-xs text-[#80958b]">{f.description}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 border-t border-[#e5ece6] pt-4 text-sm leading-6 text-[#71887d]">{result.explanation}</p>
    </div>
  )
}

export default function AreaPage() {
  const params = useParams()
  const areaId = params.areaId as string
  const area = demoAreas.find((a) => a.id === areaId)

  if (!area) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="rounded-2xl border-2 border-[#e76f51] bg-[#fff5f0] p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 flex-shrink-0 text-[#e76f51] mt-1" />
              <div>
                <h2 className="font-semibold text-[#18332b] mb-1">Area not found</h2>
                <p className="text-sm text-[#5a7067] mb-4">
                  The study area {areaId} is not available in the demo dataset.
                </p>
                <Link href="/dashboard" className="inline-block rounded-lg bg-[#18332b] px-4 py-2 text-sm font-medium text-white hover:bg-[#315548]">
                  Return to dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  const areaName = area.name.replace(' Demo Zone', '')
  const floodRisk = buildRisk(area, 'flood')
  const heatRisk = buildRisk(area, 'heat')
  const overall = overallRisk(area)

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="mb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9d8cc] bg-[#f1f5ef] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#397158]" title="These values are synthetic demonstration data created for the TerraShield prototype. They are not official measurements, forecasts, or administrative boundaries."><span className="size-1.5 rounded-full bg-[#5e9a75]" />{demoBadgeLabel}</span>
            <span className="text-xs font-medium text-[#71887d]">All risk scores are modeled estimates, not official forecasts or warnings.</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-[-.055em] text-[#18332b] sm:text-5xl">{areaName}</h1>
          <p className="mt-2 text-base text-[#71887d]">{area.region} · Nigeria</p>
          <p className="mt-1 text-sm text-[#80958b]">{areaCoordinates(area)}</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard title="Flood risk" score={area.flood} icon={Droplets} />
          <ScoreCard title="Heat risk" score={area.heat} icon={Sun} />
          <ScoreCard title="Overall resilience" score={overall} icon={ShieldCheck} />
          <ScoreCard title="Water stress" score={52} icon={Trees} />
        </div>

        <div className="mb-8"><WeatherCard lat={area.lat} lng={area.lng} /></div>

        <div className="mb-8 grid gap-5 lg:grid-cols-2">
          <FactorsSection hazard="flood" result={floodRisk} />
          <FactorsSection hazard="heat" result={heatRisk} />
        </div>

        <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
          <div className="mb-6 flex items-center gap-2">
            <Info className="size-5 text-[#4e806e]" />
            <h2 className="font-semibold">Environmental characteristics</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-xs font-semibold uppercase text-[#71887d]">Terrain susceptibility</div>
              <div className="mt-2 text-2xl font-semibold text-[#18332b]">{area.terrain}</div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e3ebe3]">
                <div className="h-full bg-[#4f806d]" style={{ width: `${area.terrain}%` }} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-[#71887d]">Drainage susceptibility</div>
              <div className="mt-2 text-2xl font-semibold text-[#18332b]">{area.drainage}</div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e3ebe3]">
                <div className="h-full bg-[#4f806d]" style={{ width: `${area.drainage}%` }} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-[#71887d]">Vegetation coverage</div>
              <div className="mt-2 text-2xl font-semibold text-[#18332b]">{area.vegetation}</div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e3ebe3]">
                <div className="h-full bg-[#4f806d]" style={{ width: `${area.vegetation}%` }} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-[#71887d]">Built-up exposure</div>
              <div className="mt-2 text-2xl font-semibold text-[#18332b]">{area.builtUp}</div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e3ebe3]">
                <div className="h-full bg-[#4f806d]" style={{ width: `${area.builtUp}%` }} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-[#71887d]">Temperature baseline</div>
              <div className="mt-2 text-2xl font-semibold text-[#18332b]">{area.temperature}°C</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-[#71887d]">Latitude & Longitude</div>
              <div className="mt-2 text-sm font-semibold text-[#18332b]">{areaCoordinates(area)}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link href="/dashboard" className="rounded-lg bg-[#18332b] px-6 py-3 font-medium text-white hover:bg-[#315548]">
            Back to dashboard
          </Link>
          <Link href="/scenarios" className="rounded-lg border border-[#c9d8cc] px-6 py-3 font-medium text-[#18332b] hover:bg-[#f0f3f1]">
            Explore scenarios
          </Link>
        </div>
        <p className="mt-6 text-xs leading-5 text-[#80958b]">{disclaimer}</p>
      </main>
    </>
  )
}
