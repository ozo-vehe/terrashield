'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ShieldCheck, Droplets, Sun, SlidersHorizontal, Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { calculateFloodRisk, calculateHeatRisk, generateRecommendations, riskLevel, riskLabel, scenarioDefaults, demoBadgeLabel, disclaimer, modeledRiskLabel } from '@/lib/climate/types'

type FloodInputs = { rainfallIntensity: number; terrainSusceptibility: number; drainageSusceptibility: number }
type HeatInputs = { temperatureC: number; vegetationCoverage: number; builtUpExposure: number }

function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9d8cc] bg-[#f1f5ef] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#397158]" title="These values are synthetic demonstration data created for the TerraShield prototype. They are not official measurements, forecasts, or administrative boundaries.">
      <span className="size-1.5 rounded-full bg-[#5e9a75]" />
      {demoBadgeLabel}
    </span>
  )
}

export default function ScenarioLab() {
  const [hazard, setHazard] = useState<'flood' | 'heat'>('flood')
  const [floodInputs, setFloodInputs] = useState<FloodInputs>({ ...scenarioDefaults.flood })
  const [heatInputs, setHeatInputs] = useState<HeatInputs>({ ...scenarioDefaults.heat })
  const [scenarioA, setScenarioA] = useState<FloodInputs | HeatInputs | null>(null)

  const isFlood = hazard === 'flood'
  const result = isFlood
    ? calculateFloodRisk(floodInputs)
    : calculateHeatRisk(heatInputs)

  const recommendations = generateRecommendations(hazard, result)

  const riskLvl = riskLevel(result.score)
  const riskLbl = riskLabel(riskLvl)

  const updateFlood = (key: keyof FloodInputs, value: number) => {
    setFloodInputs((current) => ({ ...current, [key]: value }))
  }
  const updateHeat = (key: keyof HeatInputs, value: number) => {
    setHeatInputs((current) => ({ ...current, [key]: value }))
  }

  const handleReset = () => {
    if (isFlood) setFloodInputs({ ...scenarioDefaults.flood })
    else setHeatInputs({ ...scenarioDefaults.heat })
    setScenarioA(null)
  }

  const handleSaveScenarioA = () => {
    setScenarioA(isFlood ? { ...floodInputs } : { ...heatInputs })
  }

  const scenarioAScore = scenarioA
    ? isFlood
      ? calculateFloodRisk(scenarioA as FloodInputs).score
      : calculateHeatRisk(scenarioA as HeatInputs).score
    : null
  const delta = scenarioAScore !== null ? result.score - scenarioAScore : null
  const deltaDirection = delta !== null ? (delta > 0 ? 'increased' : delta < 0 ? 'decreased' : 'unchanged') : null

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
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#71887d]">Model experimentation</p>
            <DemoBadge />
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-.055em]">Scenario lab</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71887d]">Adjust environmental parameters to see how different conditions affect modeled risk scores. Explore what-if scenarios and understand how each factor contributes to overall risk. All scores are modeled estimates, not official forecasts.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Controls */}
          <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
            <div className="mb-6">
              <div className="text-sm font-semibold mb-3">Select hazard</div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setHazard('flood'); setScenarioA(null) }}
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
                  onClick={() => { setHazard('heat'); setScenarioA(null) }}
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
                    <label htmlFor="rainfall-slider" className="block text-sm font-medium mb-2">
                      Rainfall intensity: {floodInputs.rainfallIntensity} mm
                    </label>
                    <input
                      id="rainfall-slider"
                      type="range"
                      min="0"
                      max="150"
                      value={floodInputs.rainfallIntensity}
                      onChange={(e) => updateFlood('rainfallIntensity', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer accent-[#4f806d]"
                    />
                    <p className="text-xs text-[#80958b] mt-1">0–150 mm range</p>
                  </div>
                  <div>
                    <label htmlFor="terrain-slider" className="block text-sm font-medium mb-2">
                      Terrain susceptibility: {floodInputs.terrainSusceptibility}
                    </label>
                    <input
                      id="terrain-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={floodInputs.terrainSusceptibility}
                      onChange={(e) => updateFlood('terrainSusceptibility', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer accent-[#4f806d]"
                    />
                    <p className="text-xs text-[#80958b] mt-1">How terrain concentrates runoff</p>
                  </div>
                  <div>
                    <label htmlFor="drainage-slider" className="block text-sm font-medium mb-2">
                      Drainage susceptibility: {floodInputs.drainageSusceptibility}
                    </label>
                    <input
                      id="drainage-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={floodInputs.drainageSusceptibility}
                      onChange={(e) => updateFlood('drainageSusceptibility', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer accent-[#4f806d]"
                    />
                    <p className="text-xs text-[#80958b] mt-1">Pressure on local drainage systems</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="temp-slider" className="block text-sm font-medium mb-2">
                      Temperature: {heatInputs.temperatureC}°C
                    </label>
                    <input
                      id="temp-slider"
                      type="range"
                      min="20"
                      max="45"
                      value={heatInputs.temperatureC}
                      onChange={(e) => updateHeat('temperatureC', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer accent-[#4f806d]"
                    />
                    <p className="text-xs text-[#80958b] mt-1">20–45°C range</p>
                  </div>
                  <div>
                    <label htmlFor="veg-slider" className="block text-sm font-medium mb-2">
                      Vegetation coverage: {heatInputs.vegetationCoverage}%
                    </label>
                    <input
                      id="veg-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={heatInputs.vegetationCoverage}
                      onChange={(e) => updateHeat('vegetationCoverage', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer accent-[#4f806d]"
                    />
                    <p className="text-xs text-[#80958b] mt-1">Lower coverage = higher vulnerability</p>
                  </div>
                  <div>
                    <label htmlFor="builtup-slider" className="block text-sm font-medium mb-2">
                      Built-up exposure: {heatInputs.builtUpExposure}%
                    </label>
                    <input
                      id="builtup-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={heatInputs.builtUpExposure}
                      onChange={(e) => updateHeat('builtUpExposure', Number(e.target.value))}
                      className="w-full h-2 bg-[#e3ebe3] rounded-lg appearance-none cursor-pointer accent-[#4f806d]"
                    />
                    <p className="text-xs text-[#80958b] mt-1">Urban heat-retaining surfaces</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg border border-[#dbe4dc] px-4 py-2 text-sm font-medium text-[#5a7067] hover:bg-[#f7faf4] transition"
              >
                Reset to defaults
              </button>
              <button
                onClick={handleSaveScenarioA}
                className="flex-1 rounded-lg border border-[#4e806e] px-4 py-2 text-sm font-medium text-[#397158] hover:bg-[#edf4ea] transition"
              >
                Save as Scenario A
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#71887d]">Current scenario</p>
                    <span className="rounded-full bg-[#edf4ea] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.08em] text-[#397158]">{modeledRiskLabel}</span>
                  </div>
                  <div className="text-5xl font-semibold tracking-[-.06em] text-[#18332b] mt-2">{result.score}</div>
                  <p className="text-sm text-[#8ba097] mt-1">/100 {isFlood ? 'flood' : 'heat'} risk</p>
                </div>
                <div className={`risk-${riskLvl} inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold uppercase`}>
                  <span className="size-2 rounded-full bg-current" />
                  {riskLbl}
                </div>
              </div>

              {delta !== null && deltaDirection && (
                <div className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${delta > 0 ? 'bg-[#f8d2c3] text-[#9b422f]' : delta < 0 ? 'bg-[#dcebdc] text-[#376044]' : 'bg-[#f1f5ef] text-[#55766a]'}`}>
                  {delta > 0 ? <TrendingUp className="size-4" /> : delta < 0 ? <TrendingDown className="size-4" /> : <Minus className="size-4" />}
                  {deltaDirection === 'unchanged'
                    ? 'Risk unchanged from Scenario A'
                    : `Risk ${deltaDirection} by ${Math.abs(delta)} points from Scenario A (${scenarioAScore})`}
                </div>
              )}
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
                    <p className="mt-1 text-xs text-[#80958b]">{factor.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 pt-4 border-t border-[#e5ece6] text-xs leading-5 text-[#71887d]">
                {result.explanation}
              </p>
            </div>

            <div className="rounded-2xl border border-[#dbe4dc] bg-white/70 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="size-4 text-[#c18c32]" />
                <h3 className="text-sm font-semibold">Recommendations</h3>
              </div>
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="flex gap-3 rounded-xl bg-[#f1f5ef] p-3 text-xs leading-5">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${rec.priority === 'high' ? 'bg-[#f8d2c3] text-[#9b422f]' : 'bg-[#f8e6bb] text-[#805d16]'}`}>
                      {rec.priority}
                    </span>
                    <div>
                      <p className="font-medium text-[#18332b]">{rec.title}</p>
                      <p className="mt-1 text-[#71887d]">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 pt-3 border-t border-[#e5ece6] text-xs leading-5 text-[#71887d]">
                These are general preparedness suggestions for the modeled scenario, not official emergency instructions.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs leading-5 text-[#80958b]">{disclaimer}</p>
      </main>
    </div>
  )
}
