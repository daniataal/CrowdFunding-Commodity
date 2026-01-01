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

  const updated = await prisma.systemAlert.update({
    where: { id },
    data: { resolvedAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId: gate.userId,
      action: "RESOLVE_ALERT",
      entityType: "SystemAlert",
      entityId: updated.id,
      changes: { resolvedAt: updated.resolvedAt?.toISOString() },
    },
  })

  return NextResponse.json({ success: true })
}


