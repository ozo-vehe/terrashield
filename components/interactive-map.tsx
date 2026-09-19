'use client'

import { useEffect, useRef } from 'react'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { demoAreas, riskLevel, scoreColor } from '@/lib/climate/types'

interface InteractiveMapProps {
  hazard?: 'flood' | 'heat'
  onAreaSelect?: (areaId: string) => void
}

export default function InteractiveMap({ hazard = 'flood', onAreaSelect }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const markersRef = useRef<Leaflet.Marker[]>([])

  useEffect(() => {
    if (!mapContainer.current) return
    let cancelled = false

    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !mapContainer.current) return

      const map = L.map(mapContainer.current).setView([9.05, 7.42], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 10,
      }).addTo(map)

      demoAreas.forEach((area) => {
        const score = hazard === 'flood' ? area.flood : area.heat
        const marker = L.marker([area.lat, area.lng], {
          icon: L.divIcon({
            className: 'terrashield-marker',
            html: `<span style="display:block;width:30px;height:30px;border:3px solid white;border-radius:50%;background:${scoreColor(score)};box-shadow:0 2px 8px rgba(0,0,0,.28)"></span>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(map)

        const areaName = area.name.replace(' Demo Zone', '')
        marker.bindPopup(`
          <div style="min-width:200px;font-family:system-ui,sans-serif">
            <strong style="display:block;margin-bottom:4px;color:#18332b">${areaName}</strong>
            <span style="display:block;font-size:12px;color:#5a7067;margin-bottom:8px">${area.region}</span>
            <span style="display:block;font-size:13px;margin-bottom:3px"><b>${hazard === 'flood' ? 'Flood' : 'Heat'} risk:</b> ${score}/100</span>
            <span style="display:block;font-size:11px;color:${scoreColor(score)};margin-bottom:10px">${riskLevel(score)} risk</span>
            <a href="/areas/${area.id}" style="display:block;padding:7px 10px;border-radius:5px;background:#18332b;color:white;text-align:center;text-decoration:none;font-size:12px;font-weight:600">View details</a>
          </div>
        `)
        marker.on('click', () => onAreaSelect?.(area.id))
        markersRef.current.push(marker)
      })

      mapRef.current = map
    })

    return () => {
      cancelled = true
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [hazard, onAreaSelect])

  return <div ref={mapContainer} className="h-full min-h-[500px] w-full overflow-hidden rounded-2xl border border-[#dbe4dc]" />
}
