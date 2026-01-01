import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"

const schema = z.object({
  type: z.enum(["DEPARTED", "IN_TRANSIT", "ARRIVED"]),
  occurredAt: z.union([z.string(), z.date()]).optional(),
  description: z.string().trim().min(3).optional(),
  source: z.string().trim().min(1).optional().default("MANUAL"),
})

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const body = await request.json()
  const validated = schema.parse(body)

  const occurredAt = validated.occurredAt ? new Date(validated.occurredAt as any) : new Date()
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ error: "Invalid occurredAt" }, { status: 400 })
  }

  const commodity = await prisma.commodity.findUnique({ where: { id } })
  if (!commodity) return NextResponse.json({ error: "Deal not found" }, { status: 404 })

  const description =
    validated.description ??
    (validated.type === "ARRIVED"
      ? `Arrived at ${commodity.destination}`
      : validated.type === "DEPARTED"
        ? `Departed ${commodity.origin}`
        : "Currently in transit")

  const statusFromEvent =
    validated.type === "ARRIVED" ? "ARRIVED" : validated.type === "DEPARTED" || validated.type === "IN_TRANSIT" ? "IN_TRANSIT" : undefined

  const result = await prisma.$transaction(async (tx) => {
    // Idempotency: if we already have this exact event, do nothing.
    const existing = await tx.shipmentEvent.findFirst({
      where: { commodityId: id, type: validated.type, occurredAt },
      select: { id: true },
    })

    const event =
      existing ??
      (await tx.shipmentEvent.create({
        data: {
          commodityId: id,
          type: validated.type,
          occurredAt,
          description,
          source: validated.source,
          raw: { manual: true },
        },
        select: { id: true },
      }))

    let updatedStatus: string | null = null
    if (statusFromEvent && commodity.status !== "FUNDING" && commodity.status !== statusFromEvent) {
      await tx.commodity.update({ where: { id }, data: { status: statusFromEvent as any } })
      updatedStatus = statusFromEvent
    }

    await tx.auditLog.create({
      data: {
        userId: gate.userId,
        action: "CREATE_SHIPMENT_EVENT",
        entityType: "ShipmentEvent",
        entityId: event.id,
        changes: {
          commodityId: id,
          type: validated.type,
          occurredAt: occurredAt.toISOString(),
          description,
          source: validated.source,
          updatedStatus,
        },
      },
    })

    return { eventId: event.id, updatedStatus }
  })

  return NextResponse.json({ success: true, data: result })
}


