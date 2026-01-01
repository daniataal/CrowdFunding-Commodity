import { NextRequest, NextResponse } from "next/server"
import { requireDbRole } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const req = await prisma.adminApprovalRequest.findUnique({ where: { id } })
  if (!req) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (req.status !== "PENDING") return NextResponse.json({ error: "Not pending" }, { status: 400 })

  await prisma.adminApprovalRequest.update({
    where: { id },
    data: { status: "REJECTED", rejectedBy: gate.userId, rejectedAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId: gate.userId,
      action: "REJECT_ADMIN_REQUEST",
      entityType: "AdminApprovalRequest",
      entityId: id,
      changes: { status: "REJECTED" },
    },
  })

  return NextResponse.json({ success: true })
}


