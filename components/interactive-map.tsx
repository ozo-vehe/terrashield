'use client'

import { useEffect, useRef } from 'react'
import type * as Leaflet from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface InteractiveMapProps { hazard?: 'flood' | 'heat'; onAreaSelect?: (areaId: string) => void }
export default function InteractiveMap({ onAreaSelect }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  useEffect(() => {
    if (!mapContainer.current) return
    let cancelled = false
    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !mapContainer.current) return
      const map = L.map(mapContainer.current).setView([9.0765, 7.3986], 12)
      const marker = L.marker([9.0765, 7.3986]).addTo(map)
      marker.bindPopup('<strong>Selected location</strong><br/>Click the map to move the live weather location.').openPopup()
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map)
      map.on('click', event => { marker.setLatLng(event.latlng); onAreaSelect?.(`${event.latlng.lat},${event.latlng.lng}`); marker.bindPopup(`<strong>Selected location</strong><br/>${event.latlng.lat.toFixed(4)}, ${event.latlng.lng.toFixed(4)}`).openPopup() })
      mapRef.current = map
    })
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null }
  }, [onAreaSelect])
  return <div ref={mapContainer} className="h-full min-h-[500px] w-full overflow-hidden rounded-2xl border border-[#dbe4dc]" />
}
