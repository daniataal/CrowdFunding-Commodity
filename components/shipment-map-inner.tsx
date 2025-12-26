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
  const iconSvg =
    vehicleType === "plane"
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 21l2-7 7-2-7-2-2-7-2 7-7 2 7 2 2 7z"/></svg>`
      : vehicleType === "armored"
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16V7a2 2 0 0 1 2-2h9l5 5v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/><path d="M16 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="M4 18l3-6h10l3 6"/><path d="M6 12l6-8 6 8"/></svg>`

  const title = label ? String(label).replace(/</g, "&lt;") : ""
  return `<div class="shipment-marker" title="${title}"><div class="shipment-marker__icon">${iconSvg}</div></div>`
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
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    [vehicleType, vehicleName],
  )

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <MapContainer
        center={currentPos}
        zoom={3}
        scrollWheelZoom={false}
        style={{ height: 400, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds points={route.points} />

        {/* Planned route (dashed) */}
        <Polyline positions={plannedPositions} pathOptions={{ color: "#6b7280", weight: 3, dashArray: "6 8" }} />

        {/* Travelled route (solid) */}
        <Polyline positions={travelledPositions} pathOptions={{ color: "#10b981", weight: 4 }} />

        <Marker position={currentPos} icon={markerIcon} />
      </MapContainer>
    </div>
  )
}


