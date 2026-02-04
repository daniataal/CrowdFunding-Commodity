import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const commodity = await prisma.commodity.findUnique({ where: { id } })
  if (!commodity) return NextResponse.json({ error: "Commodity not found" }, { status: 404 })

  return NextResponse.json({
    success: true,
    data: {
      id: commodity.id,
      type: commodity.type,
      name: commodity.name,
      icon: commodity.icon,
      risk: commodity.risk,
      targetApy: Number(commodity.targetApy),
      duration: commodity.duration,
      minInvestment: Number(commodity.minInvestment),
      maxInvestment: commodity.maxInvestment === null ? null : Number(commodity.maxInvestment),
      platformFeeBps: commodity.platformFeeBps,
      originLat: commodity.originLat ?? null,
      originLng: commodity.originLng ?? null,
      destLat: commodity.destLat ?? null,
      destLng: commodity.destLng ?? null,
      amountRequired: Number(commodity.amountRequired),
      currentAmount: Number(commodity.currentAmount),
      description: commodity.description,
      origin: commodity.origin,
      destination: commodity.destination,
      status: commodity.status,
      shipmentId: commodity.shipmentId,
      insuranceValue: commodity.insuranceValue === null ? null : Number(commodity.insuranceValue),
      transportMethod: commodity.transportMethod,
      riskScore: commodity.riskScore === null ? null : Number(commodity.riskScore),
      maturityDate: commodity.maturityDate ? commodity.maturityDate.toISOString() : null,
      metalForm: (commodity as any).metalForm ?? null,
      purityPercent: (commodity as any).purityPercent ?? null,
      karat: (commodity as any).karat ?? null,
      grossWeightTroyOz: (commodity as any).grossWeightTroyOz ?? null,
      refineryName: (commodity as any).refineryName ?? null,
      refineryLocation: (commodity as any).refineryLocation ?? null,
      createdAt: commodity.createdAt.toISOString(),
      updatedAt: commodity.updatedAt.toISOString(),
    },
  })
}


