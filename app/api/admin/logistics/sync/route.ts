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

  const updates: Array<{ id: string; shipmentId: string; events: any[] }> = []

  for (const d of deals) {
    const events = await fetchShipmentEventsPlaceholder({
      shipmentId: d.shipmentId as string,
      origin: d.origin,
      destination: d.destination,
    })
    updates.push({ id: d.id, shipmentId: d.shipmentId as string, events })
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


