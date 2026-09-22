'use client'

import { useEffect, useState, useMemo } from 'react'
import { Activity, CircleAlert as AlertCircle, ChevronDown, ChevronUp, ChartLine as LineChartIcon } from 'lucide-react'
import { conduitChartSeries } from '@/lib/climate/conduit'
import type { EnvironmentalObservation } from '@/lib/climate/conduit'
import { conduitBadgeLabel, conduitObservedLabel } from '@/lib/climate/types'

type ConduitApiResponse = {
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

function fmtNum(n: number | undefined, digits = 1): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

function fmtTime(ts: string | undefined): string {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
}

function MiniChart({ data, dataKey, label, unit, color }: { data: EnvironmentalObservation[]; dataKey: keyof EnvironmentalObservation; label: string; unit: string; color: string }) {
  const points = useMemo(() => {
    return data
      .map((o) => ({ ts: o.timestamp, val: o[dataKey] as number | undefined }))
      .filter((p) => p.val !== undefined && Number.isFinite(p.val))
      .reverse()
  }, [data, dataKey])

  if (points.length < 2) {
    return (
      <div className="rounded-xl border border-[#dbe4dc] bg-white p-4">
        <div className="text-xs font-semibold text-[#55766a]">{label}</div>
        <div className="mt-4 flex h-24 items-center justify-center text-xs text-[#80958b]">Insufficient data for chart</div>
      </div>
    )
  }

  const values = points.map((p) => p.val!)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 100
  const height = 60
  const step = width / (points.length - 1)

  const pathParts = points.map((p, i) => {
    const x = i * step
    const y = height - ((p.val! - min) / range) * height
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  })
  const linePath = pathParts.join(' ')
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`

  return (
    <div className="rounded-xl border border-[#dbe4dc] bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#55766a]">{label}</span>
        <span className="text-[10px] text-[#80958b]">{points.length} pts</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <span className="text-lg font-semibold text-[#18332b]">{fmtNum(points[points.length - 1].val)}</span>
          <span className="ml-1 text-xs text-[#8ba097]">{unit}</span>
        </div>
        <div className="text-[10px] text-[#80958b]">
          <span className="text-[#4e806e]">{fmtNum(min)}</span> – <span className="text-[#e76f51]">{fmtNum(max)}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full" preserveAspectRatio="none" style={{ height: '60px' }}>
        <path d={areaPath} fill={color} opacity={0.1} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-[#80958b]">
        <span>{fmtTime(points[0].ts)}</span>
        <span>{fmtTime(points[points.length - 1].ts)}</span>
      </div>
    </div>
  )
}

export default function ConduitDataExplorer() {
  const [data, setData] = useState<ConduitApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)
  const [days, setDays] = useState(1)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetch(`/api/conduit/weather?days=${days}`)
      .then((r) => r.json())
      .then((v: ConduitApiResponse) => {
        if (cancelled) return
        setData(v)
        setError(v.error?.message ?? null)
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('Unable to retrieve Conduit data.')
        setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [days])

  if (isLoading) {
    return (
      <section className="mt-12" role="status">
        <div className="rounded-2xl border border-[#c9d8cc] bg-[#edf5ec] p-6">
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-[#4e806e] animate-pulse" />
            <span className="text-sm font-medium text-[#55766a]">Loading JKUAT Conduit data…</span>
          </div>
        </div>
      </section>
    )
  }

  if (error || !data?.observations || data.observations.length === 0) {
    return (
      <section className="mt-12" role="alert">
        <div className="rounded-2xl border border-[#e9c46a]/50 bg-[#fff9e9] p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 text-[#805d16] mt-0.5" />
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4d3a8] bg-[#fff4d6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#805d16]">
                <span className="size-1.5 rounded-full bg-[#d8a84e]" />
                JKUAT CONDUIT UNAVAILABLE
              </span>
              <p className="mt-3 text-sm text-[#6e6244]">{error ?? 'No observations available for the requested period.'}</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const observations = data.observations
  const latest = data.latest

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8d7c2] bg-[#dcebdc] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#376044]">
              <span className="size-1.5 rounded-full bg-[#4e806e] animate-pulse" />
              {conduitBadgeLabel} · {conduitObservedLabel}
            </span>
            <h2 className="text-2xl font-semibold tracking-[-.04em]">Historical observations</h2>
          </div>
          <p className="mt-2 text-sm text-[#71887d]">
            {observations.length} observations from {data.fromdate} to {data.todate}
            {latest && <> · Last observed: {new Date(latest.timestamp).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC</>}
          </p>
        </div>
        <div className="flex gap-2">
          {[1, 3, 7].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${days === d ? 'bg-[#18332b] text-white' : 'border border-[#c9d8cc] text-[#5a7067] hover:bg-[#f7faf4]'}`}
            >
              {d} day{d > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {conduitChartSeries.map((series) => (
          <MiniChart
            key={series.key}
            data={observations}
            dataKey={series.key as keyof EnvironmentalObservation}
            label={series.label}
            unit={series.unit}
            color={series.color}
          />
        ))}
      </div>

      {/* Raw data table */}
      <div className="mt-8">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-2 rounded-full border border-[#c9d8cc] px-4 py-2 text-sm font-medium text-[#315548] transition hover:bg-[#f0f3f1]"
        >
          <LineChartIcon className="size-4" />
          {showRaw ? 'Hide' : 'View'} raw observation data
          {showRaw ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {showRaw && (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dbe4dc] bg-white">
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="border-b border-[#dbe4dc] bg-[#f1f5ef] text-[10px] uppercase tracking-wider text-[#71887d] sticky top-0">
                <tr>
                  <th className="px-3 py-3 font-medium">Timestamp</th>
                  <th className="px-3 py-3 font-medium">Temp (°C)</th>
                  <th className="px-3 py-3 font-medium">Humidity (%)</th>
                  <th className="px-3 py-3 font-medium">Pressure (hPa)</th>
                  <th className="px-3 py-3 font-medium">Wind (m/s)</th>
                  <th className="px-3 py-3 font-medium">Gust (m/s)</th>
                  <th className="px-3 py-3 font-medium">UV</th>
                  <th className="px-3 py-3 font-medium">Rain (mm)</th>
                  <th className="px-3 py-3 font-medium">Heat Idx</th>
                </tr>
              </thead>
              <tbody>
                {observations.slice(0, 50).map((o, i) => (
                  <tr key={i} className="border-b border-[#edf1eb] last:border-0">
                    <td className="px-3 py-2 font-mono text-[10px] text-[#55766a]">{fmtTime(o.timestamp)}</td>
                    <td className="px-3 py-2">{fmtNum(o.temperatureSht)}</td>
                    <td className="px-3 py-2">{fmtNum(o.humidity, 0)}</td>
                    <td className="px-3 py-2">{fmtNum(o.pressure, 0)}</td>
                    <td className="px-3 py-2">{fmtNum(o.windSpeed)}</td>
                    <td className="px-3 py-2">{fmtNum(o.windGust)}</td>
                    <td className="px-3 py-2">{fmtNum(o.uv)}</td>
                    <td className="px-3 py-2">{fmtNum(o.rainfallGauge1)}</td>
                    <td className="px-3 py-2">{fmtNum(o.heatIndex)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {observations.length > 50 && (
              <p className="px-3 py-3 text-[10px] text-[#80958b]">Showing first 50 of {observations.length} observations.</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
