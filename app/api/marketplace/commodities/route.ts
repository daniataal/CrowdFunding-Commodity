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
    minInvestment: Number(c.minInvestment),
    maxInvestment: c.maxInvestment === null ? null : Number(c.maxInvestment),
    platformFeeBps: c.platformFeeBps,
    originLat: c.originLat ?? null,
    originLng: c.originLng ?? null,
    destLat: c.destLat ?? null,
    destLng: c.destLng ?? null,
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
    maturityDate: c.maturityDate ? c.maturityDate.toISOString() : null,
    metalForm: (c as any).metalForm ?? null,
    purityPercent: (c as any).purityPercent ?? null,
    karat: (c as any).karat ?? null,
    grossWeightTroyOz: (c as any).grossWeightTroyOz ?? null,
    refineryName: (c as any).refineryName ?? null,
    refineryLocation: (c as any).refineryLocation ?? null,
  }))

  return NextResponse.json({ success: true, data })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation / mapping
    // We expect the Marketplace to send data matching our schema or close to it
    const commodity = await prisma.commodity.create({
      data: {
        type: body.type || "Metals",
        name: body.name,
        icon: body.icon || "gold-bar",
        risk: body.risk || "Low",
        targetApy: body.targetApy || 10.0,
        duration: body.duration || 12,
        minInvestment: body.minInvestment || 1000,
        amountRequired: body.amountRequired,
        currentAmount: 0,
        description: body.description,
        origin: body.origin || "Unknown",
        destination: body.destination || "Dubai",
        status: "FUNDING",
        shipmentId: body.shipmentId, // External ID from Marketplace

        // Detailed Metal Ops fields
        transportMethod: body.transportMethod,
        metalForm: body.metalForm,
        purityPercent: body.purityPercent,

        // Defaults
        platformFeeBps: 150
      }
    });

    return NextResponse.json({ success: true, data: commodity });
  } catch (error) {
    console.error("Error creating commodity from marketplace:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create commodity" },
      { status: 500 }
    );
  }
}


