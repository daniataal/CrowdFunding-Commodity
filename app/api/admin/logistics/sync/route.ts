import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { fetchShipmentEventsPlaceholder } from "@/lib/integrations/marinetraffic"

/**
 * Placeholder "sync" endpoint for real-world logistics updates.
 * In production this would be called by a scheduler/cron and would update commodity statuses automatically.
 */
export async function POST(_request: NextRequest) {
  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const deals = await prisma.commodity.findMany({
    where: { shipmentId: { not: null } },
    select: { id: true, name: true, shipmentId: true, origin: true, destination: true, status: true },
    take: 50,
  })

  const updates: Array<{ id: string; shipmentId: string; events: any[]; newStatus?: string }> = []

  for (const d of deals) {
    const events = await fetchShipmentEventsPlaceholder({
      shipmentId: d.shipmentId as string,
      origin: d.origin,
      destination: d.destination,
    })

    const now = new Date()

    // Persist events (idempotent via unique constraint).
    await prisma.shipmentEvent.createMany({
      data: events.map((e) => ({
        commodityId: d.id,
        type: e.type,
        occurredAt: new Date(e.at),
        description: e.description,
        source: "SIMULATED",
        raw: e,
      })),
      skipDuplicates: true,
    })

    // Update commodity status based on latest event.
    const latest = events[events.length - 1]
    let newStatus: any = undefined
    if (latest?.type === "DEPARTED" || latest?.type === "IN_TRANSIT") {
      // Only move into transit if not still funding.
      if (d.status !== "FUNDING") newStatus = "IN_TRANSIT"
    }
    if (latest?.type === "ARRIVED") {
      // Only mark ARRIVED when the event timestamp has actually passed (otherwise it's an ETA).
      const arrivedAt = new Date(latest.at)
      if (d.status !== "FUNDING" && arrivedAt <= now) newStatus = "ARRIVED"
      else if (d.status !== "FUNDING") newStatus = "IN_TRANSIT"
    }
    if (newStatus && newStatus !== d.status) {
      await prisma.commodity.update({ where: { id: d.id }, data: { status: newStatus } })
      await prisma.auditLog.create({
        data: {
          userId: gate.userId,
          action: "UPDATE_COMMODITY_STATUS",
          entityType: "Commodity",
          entityId: d.id,
          changes: { from: d.status, to: newStatus, via: "SYNC_LOGISTICS" },
        },
      })
    }

    updates.push({ id: d.id, shipmentId: d.shipmentId as string, events, newStatus })
  }

  await prisma.auditLog.create({
    data: {
      userId: gate.userId,
      action: "SYNC_LOGISTICS",
      entityType: "System",
      changes: { deals: updates.length },
    },
  })

  return NextResponse.json({ success: true, data: updates })
}


