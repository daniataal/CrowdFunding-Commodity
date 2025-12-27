import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"

const schema = z.object({
  stage: z.enum(["INSPECTED", "RELEASED"]),
})

function allowedNext(current: string, next: "INSPECTED" | "RELEASED") {
  // Enforce simple forward-only staging:
  // ARRIVED -> INSPECTED -> RELEASED -> SETTLED
  if (next === "INSPECTED") return current === "ARRIVED"
  if (next === "RELEASED") return current === "INSPECTED"
  return false
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const body = await request.json()
  const validated = schema.parse(body)

  const commodity = await prisma.commodity.findUnique({ where: { id }, select: { id: true, status: true } })
  if (!commodity) return NextResponse.json({ error: "Deal not found" }, { status: 404 })

  if (!allowedNext(commodity.status, validated.stage)) {
    return NextResponse.json(
      { error: `Invalid transition: ${commodity.status} → ${validated.stage}` },
      { status: 400 }
    )
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.commodity.update({ where: { id }, data: { status: validated.stage as any } })
    await tx.auditLog.create({
      data: {
        userId: gate.userId,
        action: "UPDATE_COMMODITY_STATUS",
        entityType: "Commodity",
        entityId: id,
        changes: { from: commodity.status, to: validated.stage, via: "SETTLEMENT_STAGE" },
      },
    })
    return u
  })

  return NextResponse.json({ success: true, data: { id: updated.id, status: updated.status } })
}


