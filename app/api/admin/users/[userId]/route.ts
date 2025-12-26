import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.enum(["USER", "ADMIN", "AUDITOR"]).optional(),
  kycStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "NOT_STARTED"]).optional(),
  phone: z.string().trim().min(1).nullable().optional(),
  company: z.string().trim().min(1).nullable().optional(),
  disabled: z.boolean().optional(),
})

export async function GET(_request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const gate = await requireDbRole(["ADMIN", "AUDITOR"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const { userId } = await context.params
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { investments: true, transactions: true, documents: true } },
      documents: {
        where: { type: { in: ["KYC_ID", "KYC_PROOF_OF_ADDRESS"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      kycStatus: user.kycStatus,
      walletBalance: Number(user.walletBalance),
      disabled: (user as any).disabled ?? false,
      disabledAt: (user as any).disabledAt ? new Date((user as any).disabledAt).toISOString() : null,
      avatar: user.avatar,
      phone: user.phone,
      company: user.company,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      _count: user._count,
      kycDocuments: user.documents.map((d) => ({
        id: d.id,
        userId: d.userId,
        commodityId: d.commodityId,
        type: d.type,
        name: d.name,
        url: d.url,
        mimeType: d.mimeType,
        size: d.size,
        verified: d.verified,
        verifiedAt: d.verifiedAt ? d.verifiedAt.toISOString() : null,
        createdAt: d.createdAt.toISOString(),
      })),
    },
  })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const gate = await requireDbRole(["ADMIN"])
    if (!gate.ok) {
      return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
    }

    const { userId } = await context.params
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

    const body = await request.json()
    const validated = updateUserSchema.parse(body)

    // Prevent accidental lockouts.
    if (gate.userId === userId) {
      if (validated.disabled === true) {
        return NextResponse.json({ error: "You cannot disable your own account" }, { status: 400 })
      }
      if (validated.role && validated.role !== "ADMIN") {
        return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 })
      }
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(validated.email !== undefined ? { email: validated.email } : {}),
        ...(validated.name !== undefined ? { name: validated.name } : {}),
        ...(validated.role !== undefined ? { role: validated.role } : {}),
        ...(validated.kycStatus !== undefined ? { kycStatus: validated.kycStatus } : {}),
        ...(validated.phone !== undefined ? { phone: validated.phone } : {}),
        ...(validated.company !== undefined ? { company: validated.company } : {}),
        ...(validated.disabled !== undefined
          ? { disabled: validated.disabled, disabledAt: validated.disabled ? new Date() : null }
          : {}),
      },
      include: {
        _count: { select: { investments: true, transactions: true, documents: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: gate.userId,
        action: "UPDATE_USER",
        entityType: "User",
        entityId: updated.id,
        changes: validated,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        kycStatus: updated.kycStatus,
        walletBalance: Number(updated.walletBalance),
        disabled: (updated as any).disabled ?? false,
        disabledAt: (updated as any).disabledAt ? new Date((updated as any).disabledAt).toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        _count: updated._count,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// "Remove" is implemented as soft-disable for safety.
export async function DELETE(_request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  const gate = await requireDbRole(["ADMIN"])
  if (!gate.ok) {
    return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
  }

  const { userId } = await context.params
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  if (gate.userId === userId) return NextResponse.json({ error: "You cannot disable your own account" }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { disabled: true, disabledAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId: gate.userId,
      action: "DISABLE_USER",
      entityType: "User",
      entityId: updated.id,
      changes: { disabled: true },
    },
  })

  return NextResponse.json({ success: true })
}


