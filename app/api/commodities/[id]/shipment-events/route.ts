import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Gatekeeping: shipment events are sensitive operational data; require auth + KYC for normal users.
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, kycStatus: true, disabled: true },
  })
  if (!dbUser || (dbUser as any).disabled) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (dbUser.role === "USER" && dbUser.kycStatus !== "APPROVED") {
    return NextResponse.json({ error: "KYC approval required" }, { status: 403 })
  }

  const events = await prisma.shipmentEvent.findMany({
    where: { commodityId: id },
    orderBy: { occurredAt: "asc" },
    take: 200,
  })

  return NextResponse.json({
    success: true,
    data: events.map((e) => ({
      id: e.id,
      commodityId: e.commodityId,
      type: e.type,
      occurredAt: e.occurredAt.toISOString(),
      description: e.description,
      source: e.source,
      createdAt: e.createdAt.toISOString(),
    })),
  })
}


