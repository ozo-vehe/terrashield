import Link from 'next/link'
import { ArrowLeft, MapPinned } from 'lucide-react'
import InteractiveMap from '@/components/interactive-map'

export default function MapPage() {
  return (
    <main className="min-h-screen bg-[#f6f7f2] text-[#18332b]">
      <header className="border-b border-[#dbe4dc] bg-[#f6f7f2]/95">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-[#315548] hover:text-[#18332b]">
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
          <Link href="/" className="font-semibold tracking-[-.03em]">Terra<span className="text-[#c18c32]">Shield</span></Link>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#71887d]"><MapPinned className="size-4" /> Risk map</div>
            <h1 className="text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Abuja climate-risk locations</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71887d]">A real street map with modeled risk locations. Select any marker to inspect the area details.</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#dbe4dc] bg-white p-2 shadow-sm">
          <InteractiveMap />
        </div>
      </section>
    </main>
  )
}
