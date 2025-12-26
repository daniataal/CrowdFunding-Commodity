import "server-only"

type GeocodeResult = { lat: number; lng: number; displayName: string }

const cache = new Map<string, { at: number; value: GeocodeResult }>()
const TTL_MS = 1000 * 60 * 60 * 24 // 24h

function cacheKey(q: string) {
  return q.trim().toLowerCase()
}

export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  const q = query.trim()
  if (!q) return null

  const key = cacheKey(q)
  const hit = cache.get(key)
  const now = Date.now()
  if (hit && now - hit.at < TTL_MS) return hit.value

  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "1")
  url.searchParams.set("q", q)

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim requires an identifying UA. Customize as needed.
      "User-Agent": "CommodityFlow/1.0 (demo; admin-geocoding)",
      Accept: "application/json",
    },
    // Keep it simple and fresh. (Server-side caching is handled above.)
    cache: "no-store",
  })

  if (!res.ok) return null
  const json = (await res.json()) as Array<any>
  const first = json?.[0]
  if (!first?.lat || !first?.lon) return null

  const value = {
    lat: Number(first.lat),
    lng: Number(first.lon),
    displayName: String(first.display_name ?? q),
  }
  if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng)) return null

  cache.set(key, { at: now, value })
  return value
}


