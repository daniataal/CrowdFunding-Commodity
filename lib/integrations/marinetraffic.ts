export type MarineTrafficEvent =
  | { type: "DEPARTED"; at: string; description: string }
  | { type: "IN_TRANSIT"; at: string; description: string }
  | { type: "ARRIVED"; at: string; description: string }

/**
 * Placeholder integration for MarineTraffic (or similar AIS providers).
 * In production this would call the vendor API by IMO/MMSI, map their statuses
 * into platform statuses, and persist events.
 */
export async function fetchShipmentEventsPlaceholder(_args: {
  shipmentId: string
  origin: string
  destination: string
}): Promise<MarineTrafficEvent[]> {
  // No paid API key yet: return a deterministic fake sequence.
  const now = new Date()
  const departed = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  const eta = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return [
    { type: "DEPARTED", at: departed.toISOString(), description: "Departed origin port" },
    { type: "IN_TRANSIT", at: now.toISOString(), description: "Currently in transit (simulated)" },
    { type: "ARRIVED", at: eta.toISOString(), description: "Estimated arrival (simulated)" },
  ]
}


