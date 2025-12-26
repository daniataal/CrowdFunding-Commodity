import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { requireDbRole } from "@/lib/authz"

const kycActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
})

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const gate = await requireDbRole(["ADMIN"])
    if (!gate.ok) {
      return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
    }

    const { userId } = await context.params
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const body = await request.json()
    const { action } = kycActionSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED"

    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: newStatus },
    })

    // Update documents as verified if approved
    if (action === "approve") {
      await prisma.document.updateMany({
        where: {
          userId,
          type: { in: ["KYC_ID", "KYC_PROOF_OF_ADDRESS"] },
        },
        data: {
          verified: true,
          verifiedAt: new Date(),
          verifiedBy: gate.userId,
        },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: gate.userId,
        action: action === "approve" ? "APPROVE_KYC" : "REJECT_KYC",
        entityType: "User",
        entityId: userId,
        changes: {
          previousStatus: user.kycStatus,
          newStatus,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("KYC action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

