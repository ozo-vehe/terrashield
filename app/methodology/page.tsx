import Link from 'next/link'
import { ArrowLeft, CircleCheck as CheckCircle2, ArrowDown, Activity, SlidersHorizontal, Lightbulb, ShieldCheck } from 'lucide-react'
import { modelWeights, disclaimer, riskThresholds, conduitStationName } from '@/lib/climate/types'
export default function Methodology() {
  return (
    <main className="min-h-screen bg-[#f6f7f2] px-5 py-10 text-[#18332b] lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-sm text-[#5e776b]"><ArrowLeft className="mr-2 inline size-4"/>Back to dashboard</Link>
        <p className="mt-16 text-xs font-semibold uppercase tracking-[.16em] text-[#668a79]">Methodology</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-.07em]">A transparent model,<br/>not a crystal ball.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-[#71887d]">TerraShield transforms real environmental observations from the JKUAT Conduit Weather Station into explainable modeled risk scores. It is designed for climate awareness and decision support—not official warnings.</p>

        {/* Data → Insight → Decision → Impact pipeline */}
        <section className="mt-12 rounded-2xl bg-[#18332b] p-6 text-white sm:p-8">
          <h2 className="text-xs font-semibold uppercase tracking-[.16em] text-[#9fc0a9]">From data to impact</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Activity, label: 'Observe', desc: 'JKUAT Conduit environmental measurements' },
              { icon: ShieldCheck, label: 'Assess', desc: 'Deterministic flood & heat risk models' },
              { icon: SlidersHorizontal, label: 'Simulate', desc: 'Explore hypothetical scenarios' },
              { icon: Lightbulb, label: 'Act', desc: 'Decision-support recommendations' },
            ].map((step, i) => (
              <div key={step.label} className="relative">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-white/10"><step.icon className="size-4" /></span>
                  <span className="text-[10px] font-semibold uppercase tracking-[.1em] text-[#9fc0a9]">0{i + 1}</span>
                </div>
                <h3 className="mt-3 font-semibold">{step.label}</h3>
                <p className="mt-1 text-xs leading-5 text-[#b7cec0]">{step.desc}</p>
                {i < 3 && <ArrowDown className="absolute -right-2 top-3 size-4 text-[#4e806e] hidden lg:block" />}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold">Flood model</h2>
            <p className="mt-4 rounded-xl bg-[#edf4ea] p-4 font-mono text-sm">risk = rainfall × {modelWeights.flood.rainfall} + terrain × {modelWeights.flood.terrain} + drainage × {modelWeights.flood.drainage}</p>
            <p className="mt-4 text-sm leading-6 text-[#71887d]">Inputs are normalized to a 0–1 range, weighted, then converted to a 0–100 score. When Conduit is active, the rainfall input comes from the actual daily rainfall total measured at the {conduitStationName}.</p>
          </section>
          <section className="rounded-2xl bg-[#18332b] p-6 text-white">
            <h2 className="font-semibold">Heat model</h2>
            <p className="mt-4 rounded-xl bg-white/10 p-4 font-mono text-sm">risk = temp × .55 + built-up × .25 + vegetation × .20</p>
            <p className="mt-4 text-sm leading-6 text-[#b7cec0]">When Conduit is active, the temperature input comes from the SHT sensor (temp_sht) at the weather station. Lower vegetation coverage contributes to vulnerability in the prototype scenario.</p>
          </section>
        </div>

        {/* Conduit normalization explanation */}
        <section className="mt-5 rounded-2xl border border-[#b8d7c2] bg-[#edf5ec] p-6">
          <h2 className="font-semibold">Conduit normalization</h2>
          <p className="mt-3 text-sm leading-6 text-[#397158]">Raw Conduit sensor values are strings and are converted to numbers during normalization. The latest observation is selected by timestamp — not simply the first record.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white/70 p-4">
              <div className="text-xs font-semibold text-[#55766a]">Rainfall normalization</div>
              <p className="mt-2 font-mono text-xs text-[#18332b]">rainfallMm = rg1tt (daily total)</p>
              <p className="mt-1 text-xs text-[#71887d]">Clamped to 0–150 mm to match the flood model&apos;s input range. Falls back to rg1 (gauge reading) if daily total is unavailable.</p>
            </div>
            <div className="rounded-xl bg-white/70 p-4">
              <div className="text-xs font-semibold text-[#55766a]">Temperature normalization</div>
              <p className="mt-2 font-mono text-xs text-[#18332b]">tempC = temp_sht</p>
              <p className="mt-1 text-xs text-[#71887d]">Clamped to 20–45°C to match the heat model&apos;s input range. Falls back to temp_bmx or temp_mcp if SHT is unavailable.</p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[#dbe4dc] bg-white p-6">
          <h2 className="font-semibold">Prototype risk categories</h2>
          <p className="mt-2 text-xs text-[#80958b]">These are illustrative prototype thresholds, not official risk classification standards.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {riskThresholds.map((item) => (
              <div key={item.label} className="rounded-xl bg-[#f1f5ef] p-4">
                <div className="text-xs text-[#71887d]">{item.range}</div>
                <div className="mt-2 text-sm font-semibold">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[#e4d3a8] bg-[#fff9e9] p-6">
          <h2 className="font-semibold">Limitations</h2>
          <div className="mt-4 grid gap-3 text-sm text-[#6e6244]">
            {[
              'Conduit is a single weather station — observations should not be treated as area-wide measurements',
              'Prototype weighting and scenario assumptions',
              'No operational validation or official alerting',
              'Scores should not replace local authority guidance',
            ].map((item) => (
              <div key={item}><CheckCircle2 className="mr-2 inline size-4"/>{item}</div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-[#897b5a]">{disclaimer}</p>
        </section>
      </div>
    </main>
  )
}
