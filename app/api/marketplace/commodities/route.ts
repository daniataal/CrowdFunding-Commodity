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
    metalForm: c.metalForm ?? null,
    purityPercent: c.purityPercent ?? null,
    karat: c.karat ?? null,
    grossWeightTroyOz: c.grossWeightTroyOz ?? null,
    refineryName: c.refineryName ?? null,
    refineryLocation: c.refineryLocation ?? null,
  }))

  return NextResponse.json({ success: true, data })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[Marketplace API] Received commodity creation request:", body);

    // Map arbitrary strings to enums
    const typeMap: Record<string, any> = {
      'gold': 'Metals',
      'silver': 'Metals',
      'platinum': 'Metals',
      'palladium': 'Metals',
      'bullion': 'Metals',
      'dore': 'Metals',
      'oil': 'Energy',
      'gas': 'Energy',
      'wheat': 'Agriculture',
      'corn': 'Agriculture',
    };

    const type = typeMap[body.type?.toLowerCase()] || (['Agriculture', 'Energy', 'Metals'].includes(body.type) ? body.type : "Metals");
    const risk = (['Low', 'Medium', 'High'].includes(body.risk) ? body.risk : "Low");

    // We expect the Marketplace to send data matching our schema or close to it
    const commodity = await prisma.commodity.create({
      data: {
        type: type as any,
        name: body.name || `${type} Investment`,
        icon: body.icon || (type === "Metals" ? "gold-bar" : "package"),
        risk: risk as any,
        targetApy: body.targetApy || 10.0,
        duration: body.duration || 12,
        minInvestment: body.minInvestment || 1000,
        amountRequired: body.amountRequired,
        currentAmount: 0,
        description: body.description || "Commodity shipment from DoreMarket",
        origin: body.origin || "Unknown",
        destination: body.destination || "Dubai",
        status: "FUNDING",
        shipmentId: String(body.shipmentId), // External ID from Marketplace

        // Detailed Metal Ops fields
        transportMethod: body.transportMethod || "Air Freight",
        metalForm: body.metalForm || (type === 'Metals' ? 'Dore' : null),
        purityPercent: body.purityPercent ? Number(body.purityPercent) : null,

        // Defaults
        platformFeeBps: 150
      }
    });

    console.log("[Marketplace API] Successfully created commodity:", commodity.id);
    return NextResponse.json({ success: true, data: commodity });
  } catch (error: any) {
    console.error("Error creating commodity from marketplace:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create commodity",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId, status } = body;

    if (!shipmentId || !status) {
      return NextResponse.json({ success: false, error: "shipmentId and status are required" }, { status: 400 });
    }

    // Find commodity by shipmentId
    const commodity = await prisma.commodity.findUnique({
      where: { shipmentId }
    });

    if (!commodity) {
      return NextResponse.json({ success: false, error: "Commodity not found" }, { status: 404 });
    }

    // Update status
    const updated = await prisma.commodity.update({
      where: { shipmentId },
      data: {
        status: status as any
      }
    });

    // If status is ARRIVED, add a shipment event
    if (status === "ARRIVED" || status === "SETTLED") {
      await prisma.shipmentEvent.create({
        data: {
          commodityId: updated.id,
          type: status === "ARRIVED" ? "ARRIVED" : "ARRIVED", // Just use ARRIVED event for now
          occurredAt: new Date(),
          description: `Delivery confirmed by Dore & Market. Status updated to ${status}.`,
          source: "DORE_MARKET"
        }
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating commodity from marketplace:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update commodity" },
      { status: 500 }
    );
  }
}


