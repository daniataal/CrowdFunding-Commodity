import { NextResponse } from "next/server"
import { getActiveShipments } from "@/app/actions/dashboard"

export async function GET() {
  const result = await getActiveShipments()
  if ("error" in result) {
    return NextResponse.json(result, { status: result.error === "Unauthorized" ? 401 : 500 })
  }
  const data = result.data.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    status: c.status,
    duration: c.duration,
    origin: c.origin,
    destination: c.destination,
    shipmentId: c.shipmentId,
    amountRequired: Number(c.amountRequired),
    currentAmount: Number(c.currentAmount),
    targetApy: Number(c.targetApy),
  }))
  return NextResponse.json({ success: true, data })
}


