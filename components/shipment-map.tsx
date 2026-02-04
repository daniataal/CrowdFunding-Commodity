"use client"

import dynamic from "next/dynamic"
import type { LatLng } from "@/lib/shipping"

export type ShipmentMapProps = {
  originCoordinates: LatLng
  destinationCoordinates: LatLng
  departureDate: Date
  arrivalDate: Date
  vesselName?: string
  vehicleType?: "ship" | "plane" | "armored"
}

const ShipmentMapInner = dynamic(() => import("./shipment-map-inner"), { ssr: false })

export function ShipmentMap(props: ShipmentMapProps) {
  return (
    <ShipmentMapInner
      origin={props.originCoordinates}
      destination={props.destinationCoordinates}
      departureDate={props.departureDate}
      arrivalDate={props.arrivalDate}
      vehicleName={props.vesselName}
      vehicleType={props.vehicleType}
    />
  )
}


