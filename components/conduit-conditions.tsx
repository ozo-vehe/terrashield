'use client'

import { useEffect, useState } from 'react'
import { Activity, CircleAlert as AlertCircle, Gauge, Wind, Droplets, Sun, Thermometer, Waves } from 'lucide-react'
import type { EnvironmentalObservation } from '@/lib/climate/conduit'
import { conduitBadgeLabel, conduitObservedLabel, conduitStationName, conduitUnavailableMessage, disclaimer } from '@/lib/climate/types'

type ConduitResponse = {
  source?: string
  fetchedAt?: string
  fromdate?: string
  todate?: string
  count?: number
  latest?: EnvironmentalObservation
  observations?: EnvironmentalObservation[]
  error?: { code: string; message: string }
  fallback?: boolean
}

function MetricCard({ icon: Icon, label, value, unit, sub }: { icon: typeof Thermometer; label: string; value: string; unit: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[#d5e3d4] bg-white/70 p-4">
      <div className="flex items-center gap-1.5 text-[#55766a]">
        <Icon className="size-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-[.1em]">{label}</span>
      </div>
      <div className="mt-2 text-xl font-semibold text-[#18332b]">
        {value}<span className="ml-1 text-sm font-normal text-[#8ba097]">{unit}</span>
      </div>
      {sub && <div className="mt-1 text-[11px] text-[#80958b]">{sub}</div>}
    </div>
  )
}

function fmtNum(n: number | undefined, digits = 1): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

function fmtTime(ts: string | undefined): string {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
}

function ConduitBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8d7c2] bg-[#dcebdc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#376044]" title="Real environmental observations from the JKUAT Conduit Weather Station.">
      <span className="size-1.5 rounded-full bg-[#4e806e] animate-pulse" />
      {conduitBadgeLabel} · {conduitObservedLabel}
    </span>
  )
}

export default function ConduitConditions() {
  const [data, setData] = useState<ConduitResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetch('/api/conduit/weather?days=1')
      .then((r) => r.json())
      .then((v: ConduitResponse) => {
        if (cancelled) return
        setData(v)
        setError(v.error?.message ?? null)
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Unable to retrieve the latest JKUAT Conduit observations.')
        setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#c9d8cc] bg-[#edf5ec] p-6" role="status">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-[#4e806e] animate-pulse" />
          <span className="text-sm font-medium text-[#55766a]">Loading JKUAT Conduit observations…</span>
        </div>
      </div>
    )
  }

  if (error || !data?.latest) {
    return (
      <div className="rounded-2xl border border-[#e9c46a]/50 bg-[#fff9e9] p-6" role="alert">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 shrink-0 text-[#805d16] mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4d3a8] bg-[#fff4d6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#805d16]">
                <span className="size-1.5 rounded-full bg-[#d8a84e]" />
                JKUAT CONDUIT UNAVAILABLE
              </span>
            </div>
            <p className="mt-3 text-sm text-[#6e6244]">{error ?? conduitUnavailableMessage}</p>
            <p className="mt-2 text-xs text-[#897b5a]">TerraShield has switched to demonstration data. {disclaimer}</p>
          </div>
        </div>
      </div>
    )
  }

  const o = data.latest

  return (
    <div className="rounded-2xl border border-[#b8d7c2] bg-[#edf5ec] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[#18332b] text-[#dcebdc]">
              <Activity className="size-4" />
            </span>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[.12em] text-[#55766a]">{conduitStationName}</div>
              <div className="text-sm font-medium text-[#18332b]">Observed conditions</div>
            </div>
          </div>
        </div>
        <ConduitBadge />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[#55766a]">
        <span>Last observed: <strong className="text-[#18332b]">{fmtTime(o.timestamp)}</strong></span>
        <span>{data.count ?? 0} observations</span>
        <span>Source: JKUAT Conduit API</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Thermometer} label="Temperature (SHT)" value={fmtNum(o.temperatureSht)} unit="°C" sub={o.heatIndex !== undefined ? `Heat index ${fmtNum(o.heatIndex)}°C` : undefined} />
        <MetricCard icon={Droplets} label="Humidity (SHT)" value={fmtNum(o.humidity, 0)} unit="%" sub={o.wetBulbTemperature !== undefined ? `Wet bulb ${fmtNum(o.wetBulbTemperature)}°C` : undefined} />
        <MetricCard icon={Gauge} label="Pressure (BME)" value={fmtNum(o.pressure, 0)} unit="hPa" />
        <MetricCard icon={Wind} label="Wind Speed" value={fmtNum(o.windSpeed)} unit="m/s" sub={o.windDirection !== undefined ? `Dir ${fmtNum(o.windDirection, 0)}°` : undefined} />
        <MetricCard icon={Wind} label="Wind Gust" value={fmtNum(o.windGust)} unit="m/s" sub={o.windGustDirection !== undefined ? `Dir ${fmtNum(o.windGustDirection, 0)}°` : undefined} />
        <MetricCard icon={Sun} label="UV Index" value={fmtNum(o.uv, 1)} unit="UV" />
        <MetricCard icon={Waves} label="Rainfall (Today)" value={fmtNum(o.rainfallGauge1Today)} unit="mm" sub={o.rainfallGauge1 !== undefined ? `Gauge ${fmtNum(o.rainfallGauge1)} mm` : undefined} />
        <MetricCard icon={Thermometer} label="Wet-Bulb Globe" value={fmtNum(o.wetBulbGlobeTemperature)} unit="°C" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#55766a]">
        {o.solarVisible !== undefined && <span className="rounded-full bg-white/60 px-2 py-1">Solar visible: {fmtNum(o.solarVisible, 0)} lx</span>}
        {o.solarInfrared !== undefined && <span className="rounded-full bg-white/60 px-2 py-1">Solar IR: {fmtNum(o.solarInfrared, 0)} lx</span>}
        {o.temperatureBmx !== undefined && <span className="rounded-full bg-white/60 px-2 py-1">Temp BME: {fmtNum(o.temperatureBmx)}°C</span>}
        {o.temperatureMcp !== undefined && <span className="rounded-full bg-white/60 px-2 py-1">Temp MCP: {fmtNum(o.temperatureMcp)}°C</span>}
        {o.rainfallGauge2Today !== undefined && <span className="rounded-full bg-white/60 px-2 py-1">Rain gauge 2 today: {fmtNum(o.rainfallGauge2Today)} mm</span>}
      </div>

      <p className="mt-4 border-t border-[#c9d8cc] pt-3 text-xs leading-5 text-[#55766a]">
        These are real observations from the JKUAT Conduit Weather Station. They are used as environmental inputs to TerraShield&apos;s modeled risk assessments. A single weather station does not represent conditions at every location.
      </p>
    </div>
  )
}
