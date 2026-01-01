import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"

export async function GET(_request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const gate = await requireDbRole(["ADMIN", "AUDITOR"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const { userId } = await context.params
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

  const logs = await prisma.auditLog.findMany({
    where: {
      entityType: "User",
      entityId: userId,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { id: true, email: true, name: true, role: true } } },
  })

  return NextResponse.json({
    success: true,
    data: logs.map((l) => ({
      id: l.id,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      changes: l.changes,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      createdAt: l.createdAt.toISOString(),
      actor: l.user
        ? { id: l.user.id, email: l.user.email, name: l.user.name, role: l.user.role }
        : null,
    })),
  })
}


