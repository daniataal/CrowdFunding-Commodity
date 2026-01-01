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
  if (req.requestedBy === gate.userId) {
    return NextResponse.json({ error: "Second approver must be different admin" }, { status: 400 })
  }

  // NOTE: execution is intentionally a placeholder. In production, this is where you'd
  // perform the action atomically (using the stored payload), then mark APPROVED.
  await prisma.adminApprovalRequest.update({
    where: { id },
    data: { status: "APPROVED", approvedBy: gate.userId, approvedAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId: gate.userId,
      action: "APPROVE_ADMIN_REQUEST",
      entityType: "AdminApprovalRequest",
      entityId: id,
      changes: { status: "APPROVED" },
    },
  })

  return NextResponse.json({ success: true })
}


