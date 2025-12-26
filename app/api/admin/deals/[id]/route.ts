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
  minInvestment: z.union([z.string(), z.number()]).optional(),
  maxInvestment: z.union([z.string(), z.number()]).nullable().optional(),
  platformFeeBps: z.union([z.string(), z.number()]).optional(),
  originLat: z.union([z.string(), z.number()]).nullable().optional(),
  originLng: z.union([z.string(), z.number()]).nullable().optional(),
  destLat: z.union([z.string(), z.number()]).nullable().optional(),
  destLng: z.union([z.string(), z.number()]).nullable().optional(),
  amountRequired: z.union([z.string(), z.number()]).optional(),
  description: z.string().min(1).optional(),
  origin: z.string().min(1).optional(),
  destination: z.string().min(1).optional(),
  shipmentId: z.string().nullable().optional(),
  insuranceValue: z.union([z.string(), z.number()]).nullable().optional(),
  transportMethod: z.string().nullable().optional(),
  riskScore: z.union([z.string(), z.number()]).nullable().optional(),
  maturityDate: z.union([z.string(), z.date()]).nullable().optional(),
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
      minInvestment: Number((commodity as any).minInvestment),
      maxInvestment: (commodity as any).maxInvestment === null ? null : Number((commodity as any).maxInvestment),
      platformFeeBps: (commodity as any).platformFeeBps,
      originLat: (commodity as any).originLat ?? null,
      originLng: (commodity as any).originLng ?? null,
      destLat: (commodity as any).destLat ?? null,
      destLng: (commodity as any).destLng ?? null,
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
      ...(validated.minInvestment !== undefined ? { minInvestment: Number(validated.minInvestment) } : {}),
      ...(validated.maxInvestment !== undefined
        ? { maxInvestment: validated.maxInvestment === null ? null : Number(validated.maxInvestment) }
        : {}),
      ...(validated.platformFeeBps !== undefined ? { platformFeeBps: Number(validated.platformFeeBps) } : {}),
      ...(validated.originLat !== undefined ? { originLat: validated.originLat === null ? null : Number(validated.originLat) } : {}),
      ...(validated.originLng !== undefined ? { originLng: validated.originLng === null ? null : Number(validated.originLng) } : {}),
      ...(validated.destLat !== undefined ? { destLat: validated.destLat === null ? null : Number(validated.destLat) } : {}),
      ...(validated.destLng !== undefined ? { destLng: validated.destLng === null ? null : Number(validated.destLng) } : {}),
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
      ...(validated.maturityDate !== undefined
        ? { maturityDate: validated.maturityDate === null ? null : new Date(validated.maturityDate as any) }
        : {}),
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


