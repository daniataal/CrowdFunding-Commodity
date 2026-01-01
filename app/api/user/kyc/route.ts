import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const docs = await prisma.document.findMany({
    where: {
      userId: session.user.id,
      type: { in: ["KYC_ID", "KYC_PROOF_OF_ADDRESS"] },
    },
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


