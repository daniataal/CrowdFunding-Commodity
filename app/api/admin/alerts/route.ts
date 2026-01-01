import { NextRequest, NextResponse } from "next/server"
import { requireDbRole } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  const gate = await requireDbRole(["ADMIN", "AUDITOR"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const alerts = await prisma.systemAlert.findMany({
    orderBy: [{ resolvedAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  })

  return NextResponse.json({
    success: true,
    data: alerts.map((a) => ({
      id: a.id,
      key: a.key,
      severity: a.severity,
      type: a.type,
      title: a.title,
      message: a.message,
      entityType: a.entityType,
      entityId: a.entityId,
      createdAt: a.createdAt.toISOString(),
      resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
    })),
  })
}


