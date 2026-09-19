'use client'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import InteractiveMap from '@/components/interactive-map'

export default function RiskMapPage() {
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
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#71887d]">Abuja · Nigeria</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-.055em]">Risk map</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71887d]">Explore modeled flood and heat risk across the demo region. Select any marker to open its complete area profile.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#dbe4dc] bg-white p-2 shadow-sm">
          <div className="h-[min(70vh,680px)] min-h-[520px]"><InteractiveMap /></div>
        </div>
      </main>
    </div>
  )
}
