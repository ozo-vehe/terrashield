'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ShieldCheck, Droplets, Sun, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculateFloodRisk, calculateHeatRisk, riskLevel, riskLabel } from '@/lib/climate/types'

export default function ScenarioLab() {
  const [hazard, setHazard] = useState<'flood' | 'heat'>('flood')
  const [floodInputs, setFloodInputs] = useState({ rainfallIntensity: 0, terrainSusceptibility: 0, drainageSusceptibility: 0 })
  const [heatInputs, setHeatInputs] = useState({ temperatureC: 20, vegetationCoverage: 0, builtUpExposure: 0 })
  useEffect(() => { Promise.all([fetch('/api/weather?lat=9.0765&lng=7.3986').then(r => r.json()), fetch('/api/geospatial?lat=9.0765&lng=7.3986').then(r => r.json())]).then(([weather, geo]) => { const c = weather.data.current; const elevation = Number(geo.elevationMeters ?? 0); const waterways = Number(geo.drainage?.nearbyWaterways ?? 0); setFloodInputs({ rainfallIntensity: Math.min(150, Math.round((c.precipitation + c.rain) * 30)), terrainSusceptibility: Math.max(0, Math.min(100, Math.round(65 - elevation / 20))), drainageSusceptibility: Math.max(0, Math.min(100, waterways === 0 ? 75 : 45)) }); setHeatInputs({ temperatureC: c.temperature_2m, vegetationCoverage: 0, builtUpExposure: Math.min(100, Math.round(c.temperature_2m * 2)) }) }).catch(() => undefined) }, [])

  const isFlood = hazard === 'flood'
  const result = isFlood
    ? calculateFloodRisk(floodInputs)
    : calculateHeatRisk(heatInputs)

  const riskLvl = riskLevel(result.score)
  const riskLbl = riskLabel(riskLvl)

  const updateFlood = (key: keyof typeof floodInputs, value: number) => {
    setFloodInputs((current) => ({ ...current, [key]: value }))
  }
  const updateHeat = (key: keyof typeof heatInputs, value: number) => {
    setHeatInputs((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-[#f6f7f2] text-[#18332b]">
      <header className="sticky top-0 z-20 border-b border-[#dbe4dc]/80 bg-[#f6f7f2]/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-[-.03em]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#18332b] text-[#eff5ea]"><ShieldCheck className="size-5" /></span>
            <span className="text-lg">Terra<span className="text-[#c18c32]">Shield</span></span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-[#5a7067] hover:text-[#18332b]"><ArrowLeft className="size-4" /> Dashboard</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="mb-9">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#71887d]">Model experimentation</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-.055em]">Scenario lab</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71887d]">Adjust environmental parameters to see how different conditions affect modeled risk scores. Explore what-if scenarios and understand how each factor contributes to overall risk.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Controls */}
          <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
            <div className="mb-6">
              <div className="text-sm font-semibold mb-3">Select hazard</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setHazard('flood')}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isFlood
                      ? 'bg-[#18332b] text-white'
                      : 'border border-[#dbe4dc] bg-white text-[#5a7067] hover:bg-[#f7faf4]'
                  }`}
                >
                  <Droplets className="inline size-4 mr-2" />
                  Flood
                </button>
                <button
                  onClick={() => setHazard('heat')}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    !isFlood
                      ? 'bg-[#18332b] text-white'
                      : 'border border-[#dbe4dc] bg-white text-[#5a7067] hover:bg-[#f7faf4]'
                  }`}
                >
                  <Sun className="inline size-4 mr-2" />
                  Heat
                </button>
              </div>
            </div>

            <div className="space-y-6 border-t border-[#e5ece6] pt-6">
              {isFlood ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rainfall intensity: {floodInputs.rainfallIntensity} mm
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={floodInputs.rainfallIntensity}
                      onChange={(e) => updateFlood('rainfallIntensity', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-[#80958b] mt-1">0–150 mm range</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Terrain susceptibility: {floodInputs.terrainSusceptibility}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={floodInputs.terrainSusceptibility}
                      onChange={(e) => updateFlood('terrainSusceptibility', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-[#80958b] mt-1">How terrain concentrates runoff</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Drainage susceptibility: {floodInputs.drainageSusceptibility}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={floodInputs.drainageSusceptibility}
                      onChange={(e) => updateFlood('drainageSusceptibility', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-[#80958b] mt-1">Pressure on local drainage systems</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Temperature: {heatInputs.temperatureC}°C
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="45"
                      value={heatInputs.temperatureC}
                      onChange={(e) => updateHeat('temperatureC', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-[#80958b] mt-1">20–45°C range</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Vegetation coverage: {heatInputs.vegetationCoverage}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={heatInputs.vegetationCoverage}
                      onChange={(e) => updateHeat('vegetationCoverage', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-[#80958b] mt-1">Lower coverage = higher vulnerability</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Built-up exposure: {heatInputs.builtUpExposure}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={heatInputs.builtUpExposure}
                      onChange={(e) => updateHeat('builtUpExposure', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-[#80958b] mt-1">Urban heat-retaining surfaces</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => isFlood ? setFloodInputs({ rainfallIntensity: 0, terrainSusceptibility: 0, drainageSusceptibility: 0 }) : setHeatInputs({ temperatureC: 20, vegetationCoverage: 0, builtUpExposure: 0 })}
              className="mt-6 w-full rounded-lg border border-[#dbe4dc] px-4 py-2 text-sm font-medium text-[#5a7067] hover:bg-[#f7faf4] transition"
            >
              Reset to defaults
            </button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#71887d]">Current scenario</p>
                  <div className="text-5xl font-semibold tracking-[-.06em] text-[#18332b] mt-2">{result.score}</div>
                  <p className="text-sm text-[#8ba097] mt-1">/100 {isFlood ? 'flood' : 'heat'} risk</p>
                </div>
                <div className={`risk-${riskLvl} inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold uppercase`}>
                  <span className="size-2 rounded-full bg-current" />
                  {riskLbl}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="size-4 text-[#4e806e]" />
                <h3 className="text-sm font-semibold">Risk drivers</h3>
              </div>
              <div className="space-y-4">
                {result.factors.map((factor) => (
                  <div key={factor.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium">{factor.name}</span>
                      <span className="text-[#5a7067]">{Math.round(factor.contribution)} pts</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#e3ebe3]">
                      <div
                        className="h-full rounded-full bg-[#4f806d]"
                        style={{ width: `${Math.min(100, factor.contribution * 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 pt-4 border-t border-[#e5ece6] text-xs leading-5 text-[#71887d]">
                {result.explanation}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
