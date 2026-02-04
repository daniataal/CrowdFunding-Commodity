"use client"

import "leaflet/dist/leaflet.css"

import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import type { LatLng } from "@/lib/shipping"
import { buildSeaRoute, calculateVesselPosition } from "@/lib/shipping"

type ShipmentMapInnerProps = {
  origin: LatLng
  destination: LatLng
  departureDate: Date
  arrivalDate: Date
  vehicleName?: string
  vehicleType?: "ship" | "plane" | "armored"
}

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap()
  useEffect(() => {
    if (!points || points.length < 2) return
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
    map.fitBounds(bounds.pad(0.2), { animate: false })
  }, [map, points])
  return null
}

function markerHtml(vehicleType: ShipmentMapInnerProps["vehicleType"], label?: string) {
  const colorClass =
    vehicleType === "plane" ? "text-blue-500" : vehicleType === "armored" ? "text-amber-500" : "text-emerald-500"

  const iconSvg =
    vehicleType === "plane"
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]"><path d="M10 21l2-7 7-2-7-2-2-7-2 7-7 2 7 2 2 7z"/></svg>`
      : vehicleType === "armored"
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"><path d="M3 16V7a2 2 0 0 1 2-2h9l5 5v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/><path d="M16 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"><path d="M3 18h18"/><path d="M4 18l3-6h10l3 6"/><path d="M6 12l6-8 6 8"/></svg>`

  const title = label ? String(label).replace(/</g, "&lt;") : ""
  return `<div class="shipment-marker transform transition-all duration-500 ${colorClass}" title="${title}">
    <div class="shipment-marker__icon bg-[#0A0A0A] p-2 rounded-full border border-white/20 shadow-[0_0_15px_currentColor] backdrop-blur-sm">
      ${iconSvg}
    </div>
  </div>`
}

export default function ShipmentMapInner({
  origin,
  destination,
  departureDate,
  arrivalDate,
  vehicleName,
  vehicleType = "ship",
}: ShipmentMapInnerProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30)
    return () => clearInterval(t)
  }, [])

  const route = useMemo(() => buildSeaRoute(origin, destination), [origin, destination])
  const vessel = useMemo(
    () =>
      calculateVesselPosition({
        now,
        departureDate,
        arrivalDate,
        routePoints: route.points,
      }),
    [now, departureDate, arrivalDate, route.points],
  )

  const plannedPositions: Array<[number, number]> = route.points.map((p) => [p.lat, p.lng])
  const travelledPositions: Array<[number, number]> = vessel.travelled.map((p) => [p.lat, p.lng])
  const currentPos: [number, number] = [vessel.current.lat, vessel.current.lng]

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        html: markerHtml(vehicleType, vehicleName),
        className: "shipment-marker-wrapper",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    [vehicleType, vehicleName],
  )

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A]">
      <MapContainer
        center={currentPos}
        zoom={3}
        scrollWheelZoom={false}
        style={{ height: 400, width: "100%", background: "#0A0A0A" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds points={route.points} />

        {/* Planned route (dashed) */}
        <Polyline positions={plannedPositions} pathOptions={{ color: "rgba(255, 255, 255, 0.2)", weight: 2, dashArray: "4 8" }} />

        {/* Travelled route (solid) */}
        <Polyline positions={travelledPositions} pathOptions={{ color: "#10b981", weight: 3, shadowBlur: 10, shadowColor: "#10b981" }} />

        <Marker position={currentPos} icon={markerIcon} />
      </MapContainer>
    </div>
  )
}


