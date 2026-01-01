import { NextRequest, NextResponse } from "next/server"
import { requireDbRole } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  const gate = await requireDbRole(["ADMIN", "AUDITOR"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const items = await prisma.adminApprovalRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return NextResponse.json({
    success: true,
    data: items.map((r) => ({
      id: r.id,
      action: r.action,
      status: r.status,
      entityType: r.entityType,
      entityId: r.entityId,
      requestedBy: r.requestedBy,
      approvedBy: r.approvedBy,
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      rejectedBy: r.rejectedBy,
      rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      payload: r.payload,
    })),
  })
}


