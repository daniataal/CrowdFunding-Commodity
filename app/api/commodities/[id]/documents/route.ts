import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Public/user-facing: only expose verified documents for a deal
  const docs = await prisma.document.findMany({
    where: { commodityId: id, verified: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    success: true,
    data: docs.map((d) => ({
      id: d.id,
      commodityId: d.commodityId,
      userId: d.userId,
      type: d.type,
      name: d.name,
      url: d.url,
      mimeType: d.mimeType,
      size: d.size,
      verified: d.verified,
      verifiedAt: d.verifiedAt ? d.verifiedAt.toISOString() : null,
      createdAt: d.createdAt.toISOString(),
    })),
  })
}


