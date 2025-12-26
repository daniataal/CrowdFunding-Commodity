import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireDbRole } from "@/lib/authz"
import { z } from "zod"
import bcrypt from "bcryptjs"
import crypto from "crypto"

function generateTempPassword() {
  const raw = crypto.randomBytes(24).toString("base64url")
  return raw.slice(0, 16)
}

const resetSchema = z.object({
  // If provided, admin sets an explicit password. Otherwise, a temp password is generated and returned once.
  password: z.string().min(8).optional(),
})

export async function POST(request: NextRequest, context: { params: Promise<{ userId: string }> }) {
  try {
    const gate = await requireDbRole(["ADMIN"])
    if (!gate.ok) {
      return NextResponse.json({ error: gate.status === 403 ? "Forbidden" : "Unauthorized" }, { status: gate.status })
    }

    const { userId } = await context.params
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    if (gate.userId === userId) return NextResponse.json({ error: "Use Settings to change your own password" }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const validated = resetSchema.parse(body)

    const tempPassword = validated.password ?? generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 })

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    await prisma.auditLog.create({
      data: {
        userId: gate.userId,
        action: "RESET_PASSWORD",
        entityType: "User",
        entityId: userId,
        changes: { mode: validated.password ? "set_explicit" : "generated_temp" },
      },
    })

    return NextResponse.json({ success: true, tempPassword: validated.password ? null : tempPassword })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error("Admin password reset error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


