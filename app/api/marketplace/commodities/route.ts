import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const risk = searchParams.get("risk")

  const where: any = { status: "FUNDING" }
  if (type && type !== "All") where.type = type
  if (risk && risk !== "All") where.risk = risk

  const commodities = await prisma.commodity.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  // Convert Decimal-like fields to numbers for the client
  const data = commodities.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    icon: c.icon,
    risk: c.risk,
    targetApy: Number(c.targetApy),
    duration: c.duration,
    amountRequired: Number(c.amountRequired),
    currentAmount: Number(c.currentAmount),
    description: c.description,
    origin: c.origin,
    destination: c.destination,
    status: c.status,
    shipmentId: c.shipmentId,
    insuranceValue: c.insuranceValue === null ? null : Number(c.insuranceValue),
    transportMethod: c.transportMethod,
    riskScore: c.riskScore === null ? null : Number(c.riskScore),
  }))

  return NextResponse.json({ success: true, data })
}


