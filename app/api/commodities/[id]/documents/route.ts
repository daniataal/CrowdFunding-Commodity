import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Gatekeeping: deal documents are sensitive; require authentication + KYC approval.
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Allow admins/auditors to view regardless of KYC.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, kycStatus: true, disabled: true },
  })
  if (!dbUser || (dbUser as any).disabled) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (dbUser.role === "USER" && dbUser.kycStatus !== "APPROVED") {
    return NextResponse.json({ error: "KYC approval required" }, { status: 403 })
  }

  // User-facing: only expose verified documents for a deal
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


