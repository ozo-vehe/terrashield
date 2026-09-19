'use client'

import { useEffect, useRef } from 'react'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { demoAreas, scoreColor, mapDemoLabel, mapZoneDisclaimer } from '@/lib/climate/types'

interface InteractiveMapProps { hazard?: 'flood' | 'heat'; onAreaSelect?: (areaId: string) => void }
export default function InteractiveMap({ hazard = 'flood', onAreaSelect }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  useEffect(() => {
    if (!mapContainer.current) return
    let cancelled = false
    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !mapContainer.current) return
      const map = L.map(mapContainer.current).setView([9.0765, 7.3986], 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map)

      const demoLabel = L.control({ position: 'topright' })
      demoLabel.onAdd = () => {
        const div = L.DomUtil.create('div', 'terrahield-demo-label')
        div.innerHTML = `<div style="background:#f7faf4;border:1px solid #c9d8cc;border-radius:8px;padding:6px 10px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#397158;box-shadow:0 1px 3px rgba(0,0,0,.08);cursor:help;" title="${mapZoneDisclaimer}">${mapDemoLabel}</div>`
        L.DomEvent.disableClickPropagation(div)
        return div
      }
      demoLabel.addTo(map)

      demoAreas.forEach((area) => {
        const score = hazard === 'flood' ? area.flood : area.heat
        const color = scoreColor(score)
        const marker = L.circleMarker([area.lat, area.lng], {
          radius: 10,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(map)
        const riskWord = score >= 75 ? 'Very high' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low'
        marker.bindPopup(
          `<div style="font-family:Arial,sans-serif"><strong>${area.name.replace(' Demo Zone', '')}</strong><br/><span style="color:${color};font-weight:600">${riskWord} ${hazard} risk</span> · ${score}/100<br/><span style="font-size:11px;color:#71887d">DEMO DATA · Illustrative zone</span><br/><br/><a href="/areas/${area.id}" style="color:#3c765f;font-weight:600;text-decoration:none">View area details →</a></div>`
        )
      })

      const clickMarker = L.marker([9.0765, 7.3986]).addTo(map)
      clickMarker.bindPopup('<strong>Selected location</strong><br/>Click the map to move the live weather location.').openPopup()
      map.on('click', (event) => {
        clickMarker.setLatLng(event.latlng)
        onAreaSelect?.(`${event.latlng.lat},${event.latlng.lng}`)
        clickMarker.bindPopup(`<strong>Selected location</strong><br/>${event.latlng.lat.toFixed(4)}, ${event.latlng.lng.toFixed(4)}`).openPopup()
      })

      mapRef.current = map
    })
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null }
  }, [hazard, onAreaSelect])
  return <div ref={mapContainer} className="h-full min-h-[500px] w-full overflow-hidden rounded-2xl border border-[#dbe4dc]" />
}
