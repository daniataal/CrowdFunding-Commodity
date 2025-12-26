import searoute from "searoute-js"

export type LatLng = { lat: number; lng: number }

export type ShipmentRoute = {
  points: LatLng[]
  lengthNm?: number
}

function clamp01(x: number) {
  if (x < 0) return 0
  if (x > 1) return 1
  return x
}

export function calculateTripProgressPercent(now: Date, departureDate: Date, arrivalDate: Date) {
  const start = departureDate.getTime()
  const end = arrivalDate.getTime()
  const t = now.getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  return clamp01((t - start) / (end - start))
}

function haversineMeters(a: LatLng, b: LatLng) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
  return R * c
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function sliceRouteByProgress(points: LatLng[], progress01: number): { travelled: LatLng[]; current: LatLng } {
  if (!points || points.length === 0) {
    return { travelled: [], current: { lat: 0, lng: 0 } }
  }
  if (points.length === 1) return { travelled: [points[0]], current: points[0] }

  const p = clamp01(progress01)
  if (p <= 0) return { travelled: [points[0]], current: points[0] }
  if (p >= 1) return { travelled: [...points], current: points[points.length - 1] }

  const segLens: number[] = []
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    const len = haversineMeters(points[i], points[i + 1])
    segLens.push(len)
    total += len
  }
  if (total <= 0) return { travelled: [points[0]], current: points[0] }

  const target = total * p
  let acc = 0
  const travelled: LatLng[] = [points[0]]

  for (let i = 0; i < segLens.length; i++) {
    const nextAcc = acc + segLens[i]
    const a = points[i]
    const b = points[i + 1]
    if (target >= nextAcc) {
      travelled.push(b)
      acc = nextAcc
      continue
    }
    const localT = (target - acc) / segLens[i]
    const current = { lat: lerp(a.lat, b.lat, localT), lng: lerp(a.lng, b.lng, localT) }
    travelled.push(current)
    return { travelled, current }
  }

  return { travelled: [...points], current: points[points.length - 1] }
}

export function calculateVesselPosition(args: {
  now: Date
  departureDate: Date
  arrivalDate: Date
  routePoints: LatLng[]
}) {
  const progress = calculateTripProgressPercent(args.now, args.departureDate, args.arrivalDate)
  return { progress, ...sliceRouteByProgress(args.routePoints, progress) }
}

/**
 * Build a realistic maritime route using searoute-js.
 * searoute-js expects [lon, lat] pairs and returns a GeoJSON Feature LineString.
 */
export function buildSeaRoute(origin: LatLng, destination: LatLng): ShipmentRoute {
  try {
    const feature: any = (searoute as any)([origin.lng, origin.lat], [destination.lng, destination.lat])
    const coords: Array<[number, number]> = feature?.geometry?.coordinates ?? []
    const points: LatLng[] = coords.map(([lng, lat]) => ({ lat, lng }))
    const lengthNm: number | undefined = feature?.properties?.length
    if (points.length >= 2) return { points, lengthNm }
  } catch {
    // ignore and fall back
  }
  return { points: [origin, destination] }
}


