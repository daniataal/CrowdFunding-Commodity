import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["Agriculture", "Energy", "Metals"]).optional(),
  risk: z.enum(["Low", "Medium", "High"]).optional(),
  targetApy: z.union([z.string(), z.number()]).optional(),
  duration: z.union([z.string(), z.number()]).optional(),
  amountRequired: z.union([z.string(), z.number()]).optional(),
  description: z.string().min(1).optional(),
  origin: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  shipmentId: z.string().nullable().optional(),
  insuranceValue: z.union([z.string(), z.number()]).nullable().optional(),
  transportMethod: z.string().nullable().optional(),
  riskScore: z.union([z.string(), z.number()]).nullable().optional(),
  status: z.enum(["FUNDING", "ACTIVE", "IN_TRANSIT", "SETTLED", "CANCELLED"]).optional(),
})

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const gate = await requireDbRole(["ADMIN", "AUDITOR"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const commodity = await prisma.commodity.findUnique({ where: { id } })
  if (!commodity) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    success: true,
    data: {
      ...commodity,
      targetApy: Number(commodity.targetApy),
      amountRequired: Number(commodity.amountRequired),
      currentAmount: Number(commodity.currentAmount),
      insuranceValue: commodity.insuranceValue === null ? null : Number(commodity.insuranceValue),
      riskScore: commodity.riskScore === null ? null : Number(commodity.riskScore),
    },
  })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const body = await request.json()
  const validated = updateSchema.parse(body)

  const updated = await prisma.commodity.update({
    where: { id },
    data: {
      ...(validated.name !== undefined ? { name: validated.name } : {}),
      ...(validated.type !== undefined ? { type: validated.type } : {}),
      ...(validated.risk !== undefined ? { risk: validated.risk } : {}),
      ...(validated.targetApy !== undefined ? { targetApy: Number(validated.targetApy) } : {}),
      ...(validated.duration !== undefined ? { duration: Number(validated.duration) } : {}),
      ...(validated.amountRequired !== undefined ? { amountRequired: Number(validated.amountRequired) } : {}),
      ...(validated.description !== undefined ? { description: validated.description } : {}),
      ...(validated.origin !== undefined ? { origin: validated.origin } : {}),
      ...(validated.destination !== undefined ? { destination: validated.destination } : {}),
      ...(validated.shipmentId !== undefined ? { shipmentId: validated.shipmentId } : {}),
      ...(validated.insuranceValue !== undefined
        ? { insuranceValue: validated.insuranceValue === null ? null : Number(validated.insuranceValue) }
        : {}),
      ...(validated.transportMethod !== undefined ? { transportMethod: validated.transportMethod } : {}),
      ...(validated.riskScore !== undefined ? { riskScore: validated.riskScore === null ? null : Number(validated.riskScore) } : {}),
      ...(validated.status !== undefined ? { status: validated.status } : {}),
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: gate.userId,
      action: "UPDATE_COMMODITY",
      entityType: "Commodity",
      entityId: updated.id,
      changes: validated,
    },
  })

  return NextResponse.json({ success: true, data: updated })
}


